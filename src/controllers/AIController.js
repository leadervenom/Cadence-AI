class AIController {

    getStatus(req,res){

        res.json({

            module:"Gemini AI Engine",

            status:"ACTIVE",

            provider:"gemini",

            serviceUrl: process.env.GEMINI_SERVICE_URL || "http://localhost:8000"

        });

    }


    async chat(req, res, next) {

        try {

            const serviceUrl = process.env.GEMINI_SERVICE_URL || "http://localhost:8000";

            const body = this.buildChatPayload(req.body || {});

            let { response, data } = await this.postJson(`${serviceUrl}/chat`, body);

            if (response.status === 422 && body.message) {

                ({ response, data } = await this.postJson(`${serviceUrl}/chat`, {

                    message: body.message

                }));

            }

            if (!response.ok) {

                res.status(response.status).json({

                    error: data.detail || data.error || "Gemini service request failed"

                });

                return;

            }

            res.json({

                reply: data.reply || data.response || data.result || data.message || ""

            });

        } catch (error) {

            if (error.cause?.code === "ECONNREFUSED") {

                res.status(503).json({

                    error: "Gemini FastAPI service is not running. Start it with npm run ai."

                });

                return;

            }

            next(error);

        }

    }


    buildChatPayload(body) {

        const lastMessage = Array.isArray(body.messages)
            ? [...body.messages].reverse().find((message) => message.role === "user")
            : null;

        const message = body.message || lastMessage?.content || "";

        return {

            ...body,

            message

        };

    }


    async postJson(url, body) {

        const response = await fetch(url, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(body)

        });

        const data = await response.json().catch(() => ({}));

        return {

            response,

            data

        };

    }


    async parseProtocol(req, res, next) {

        this.forwardToGeminiService("/protocol/parse", req, res, next);

    }


    async generateProtocolRunningOrder(req, res, next) {

        this.forwardToGeminiService("/protocol/running-order", req, res, next);

    }


    async extractProtocol(req, res, next) {

        this.forwardToGeminiService("/protocol/extract", req, res, next);

    }


    async forwardToGeminiService(path, req, res, next) {

        try {

            const serviceUrl = process.env.GEMINI_SERVICE_URL || "http://localhost:8000";

            const response = await fetch(`${serviceUrl}${path}`, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(req.body || {})

            });


            const data = await response.json().catch(() => ({}));

            if (!response.ok) {

                res.status(response.status).json({

                    error: data.detail || data.error || "Gemini service request failed"

                });

                return;

            }

            res.json(data);

        } catch (error) {

            if (error.cause?.code === "ECONNREFUSED") {

                res.status(503).json({

                    error: "Gemini FastAPI service is not running. Start it with npm run ai."

                });

                return;

            }

            next(error);

        }

    }

}

export default AIController;
