import StructuredCommandService from "../ai-engine/services/StructuredCommandService.js";
import EventExtractionRepository from "../repositories/EventExtractionRepository.js";
import AIChatHistoryRepository from "../repositories/AIChatHistoryRepository.js";
import EventRepository from "../repositories/EventRepository.js";

class AIController {

    constructor() {
        this.structuredCommandService = new StructuredCommandService();
        this.eventExtractionRepository = new EventExtractionRepository();
        this.aiChatHistoryRepository = new AIChatHistoryRepository();
        this.eventRepository = new EventRepository();
    }


    getStatus(req,res){

        res.json({

            module:"AI Engine",

            status:"ACTIVE"

        });

    }


    async getChatHistory(req,res){

        try {

            const chat = await this.aiChatHistoryRepository
                .getChat(req.params.eventId);

            return res.json(chat);

        }

        catch(error) {

            return res.status(500).json({
                message:error.message
            });

        }

    }


    async saveChatHistory(req,res){

        try {

            const chat = await this.aiChatHistoryRepository
                .saveChat(req.params.eventId, req.body);

            return res.json(chat);

        }

        catch(error) {

            return res.status(500).json({
                message:error.message
            });

        }

    }


    async chat(req,res){

        try {

            const apiKey =
                process.env.GEMINI_API_KEY ||
                process.env.VITE_GEMINI_API_KEY ||
                process.env.VITE_ANTHROPIC_API_KEY;

            if(!apiKey) {
                return res.status(500).json({
                    message:"Missing GEMINI_API_KEY in backend .env"
                });
            }

            const {
                systemPrompt = "",
                messages = [],
                event = null
            } = req.body || {};

            const model =
                process.env.GEMINI_MODEL ||
                "gemini-3.5-flash";

            const contents = messages.map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [
                    {
                        text: String(message.content || "")
                    }
                ]
            }));

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                        "x-goog-api-key":apiKey
                    },
                    body:JSON.stringify({
                        systemInstruction:{
                            parts:[
                                {
                                    text:this.structuredCommandService
                                        .buildSystemPrompt(systemPrompt)
                                }
                            ]
                        },
                        contents,
                        generationConfig:{
                            maxOutputTokens:1000,
                            responseMimeType:"application/json"
                        }
                    })
                }
            );

            const data = await response.json();

            if(!response.ok) {
                return res.status(response.status).json({
                    message:
                        data?.error?.message ||
                        `Gemini request failed: ${response.status}`
                });
            }

            const reply =
                data?.candidates?.[0]?.content?.parts
                    ?.map((part) => part.text || "")
                    .join("")
                    .trim();

            let parsed;

            try {
                parsed = this.structuredCommandService
                    .parseGeminiResponse(reply);
            }
            catch(error) {
                return res.json({
                    reply:"I could not turn that into a valid system update. Please ask for one clear event change at a time.",
                    command:null,
                    validation:{
                        valid:false,
                        errors:["Gemini did not return a valid internal command."]
                    },
                    applied:false,
                    database:{
                        updated:false,
                        snapshotUpdated:false,
                        reason:"No valid command was produced."
                    },
                    updatedEvent:null
                });
            }

            const normalized = this.structuredCommandService
                .normalize(parsed);

            const result = this.structuredCommandService
                .apply(normalized, event);

            let database = {
                updated:false,
                reason:"No event update command was applied."
            };

            if(result.applied) {
                database = await this.persistCommandResult(
                    normalized.command,
                    result.event
                );
            }

            const visibleReply = this.structuredCommandService
                .toVisibleReply(normalized, result);

            return res.json({
                reply:visibleReply,
                command:normalized.command,
                validation:result.validation,
                applied:result.applied,
                database,
                updatedEvent:result.applied ? result.event : null
            });

        }

        catch(error) {

            return res.status(500).json({
                message:error.message
            });

        }

    }


    async persistCommandResult(command, updatedEvent) {
        const eventId = updatedEvent?.id;
        const section = command?.target?.section;
        const extractionTypeBySection = {
            running_order:"running_order",
            vips:"vip_list",
            seating:"seating_layout"
        };
        const extractionType = extractionTypeBySection[section];

        if(!eventId || !section) {
            return {
                updated:false,
                snapshotUpdated:false,
                reason:"Missing event id or target section."
            };
        }

        try {
            await this.eventRepository
                .updateEventData(eventId, {
                    [section]:updatedEvent[section]
                });
        }
        catch(error) {
            return {
                updated:false,
                snapshotUpdated:false,
                reason:`Event snapshot failed: ${error.message}`
            };
        }

        if(!extractionType) {
            return {
                updated:false,
                snapshotUpdated:true,
                reason:`Section '${section}' is not persisted in event_extractions.`
            };
        }

        try {
            const extraction = await this.eventExtractionRepository
                .createExtractionSnapshot({
                    eventId,
                    extractionType,
                    extractedData:updatedEvent[section],
                    validationStatus:"published"
                });

            return {
                updated:true,
                snapshotUpdated:true,
                extractionId:extraction.extraction_id
            };
        }
        catch(error) {
            return {
                updated:false,
                snapshotUpdated:true,
                reason:error.message
            };
        }
    }

}

export default AIController;
