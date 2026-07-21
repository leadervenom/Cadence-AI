class AIController {

    getStatus(req,res){

        res.json({

            module:"AI Engine",

            status:"ACTIVE"

        });

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
                messages = []
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
                                    text:String(systemPrompt)
                                }
                            ]
                        },
                        contents,
                        generationConfig:{
                            maxOutputTokens:1000
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

            return res.json({
                reply: reply || "Unable to get a response. Please try again."
            });

        }

        catch(error) {

            return res.status(500).json({
                message:error.message
            });

        }

    }

}

export default AIController;
