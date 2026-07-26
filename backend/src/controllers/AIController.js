import { allDeclarations, dispatch } from "../ai-engine/tools/index.js";
import { buildSourceContext } from "../ai-engine/services/sourceContextBuilder.js";
import EventRepository from "../repositories/EventRepository.js";
import EventExtractionRepository from "../repositories/EventExtractionRepository.js";
import VIPProfileRepository from "../repositories/VIPProfileRepository.js";
import VIPRankingRepository from "../repositories/VIPRankingRepository.js";
import EventParticipantRepository from "../repositories/EventParticipantRepository.js";
import AIChatHistoryRepository from "../repositories/AIChatHistoryRepository.js";

const SYSTEM_PERSONA = `
You are Cadence AI inside an event management system. You can read and change
event data directly using the tools available to you.

Rules:
- If the user only asks a question, just answer in "reply" — do not call a tool.
- Call at most one tool per turn, for the single most direct action that satisfies the request.
- Every item in running_order, vips, sources, and seating.layouts has a stable "id" in the current event data you were given — use it exactly as given, never invent or change one.
- When asked to build a running order from uploaded source documents, read the source content already provided to you in context, extract activities in chronological order, and call replace_running_order.
- Inviting a guest never sends anything immediately — stage_rsvp_invite only proposes the invite for a human to confirm.
- Keep "reply" short, concise, and operational — a couple of sentences, bullet points for lists.
`.trim();

class AIController {

    constructor() {
        this.eventRepository = new EventRepository();
        this.eventExtractionRepository = new EventExtractionRepository();
        this.vipRepository = new VIPProfileRepository();
        this.rankingRepository = new VIPRankingRepository();
        this.participantRepository = new EventParticipantRepository();
        this.aiChatHistoryRepository = new AIChatHistoryRepository();
    }


    getStatus(req, res) {
        res.json({
            module: "AI Engine",
            status: "ACTIVE"
        });
    }


    async getChatHistory(req, res) {
        const chat = await this.aiChatHistoryRepository.getChat(req.params.eventId);
        return res.json(chat);
    }


    async saveChatHistory(req, res) {
        const chat = await this.aiChatHistoryRepository.saveChat(req.params.eventId, req.body);
        return res.json(chat);
    }


    buildSystemInstruction(systemPrompt, event, latestUserMessage) {
        const eventContext = {
            id: event?.id,
            name: event?.name,
            date: event?.date,
            venue: event?.venue,
            status: event?.status,
            running_order: event?.running_order,
            vips: event?.vips,
            seating: event?.seating,
            sources: buildSourceContext(event?.sources, latestUserMessage)
        };

        return [
            SYSTEM_PERSONA,
            String(systemPrompt || "").trim(),
            `Current event data:\n${JSON.stringify(eventContext, null, 2)}`
        ]
            .filter(Boolean)
            .join("\n\n");
    }


    async chat(req, res) {

        const apiKey =
            process.env.GEMINI_API_KEY ||
            process.env.VITE_GEMINI_API_KEY ||
            process.env.VITE_ANTHROPIC_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                message: "Missing GEMINI_API_KEY in backend .env"
            });
        }

        const {
            systemPrompt = "",
            messages = [],
            event = null
        } = req.body || {};

        const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";

        const contents = messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: String(message.content || "") }]
        }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: this.buildSystemInstruction(systemPrompt, event, lastUserMessage) }]
                    },
                    contents,
                    tools: [{ functionDeclarations: allDeclarations }],
                    generationConfig: {
                        maxOutputTokens: 1000
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: data?.error?.message || `Gemini request failed: ${response.status}`
            });
        }

        const parts = data?.candidates?.[0]?.content?.parts || [];
        const functionCallPart = parts.find((part) => part.functionCall);
        const textReply = parts
            .filter((part) => part.text)
            .map((part) => part.text)
            .join("")
            .trim();

        if (!functionCallPart) {
            return res.json({
                reply: textReply || "I processed that request.",
                toolCall: null,
                applied: false,
                database: { updated: false, reason: "No tool was called." },
                updatedEvent: null,
                proposedAction: null
            });
        }

        if (!event || typeof event !== "object") {
            return res.json({
                reply: "I need the current event data to do that. Please try again.",
                toolCall: { name: functionCallPart.functionCall.name, args: functionCallPart.functionCall.args },
                applied: false,
                database: { updated: false, reason: "Missing event snapshot." },
                updatedEvent: null,
                proposedAction: null
            });
        }

        const context = {
            event,
            userId: req.user?.id || null,
            repositories: {
                eventRepository: this.eventRepository,
                eventExtractionRepository: this.eventExtractionRepository,
                vipRepository: this.vipRepository,
                rankingRepository: this.rankingRepository,
                participantRepository: this.participantRepository
            }
        };

        const { name: toolName, args: toolArgs } = functionCallPart.functionCall;

        let result;

        try {
            result = await dispatch(toolName, toolArgs, context);
        }
        catch (error) {
            return res.json({
                reply: `I tried to do that but ran into an error: ${error.message}`,
                toolCall: { name: toolName, args: toolArgs },
                applied: false,
                database: { updated: false, reason: error.message },
                updatedEvent: null,
                proposedAction: null
            });
        }

        return res.json({
            reply: result.reply || textReply || (result.ok ? "Done." : "I could not complete that request."),
            toolCall: { name: toolName, args: toolArgs },
            applied: Boolean(result.ok && result.persisted),
            database: {
                updated: Boolean(result.persisted),
                reason: result.persisted ? undefined : (result.ok ? "No database change was needed." : result.reply)
            },
            updatedEvent: result.updatedEvent || null,
            proposedAction: result.proposedAction || null
        });

    }

}

export default AIController;
