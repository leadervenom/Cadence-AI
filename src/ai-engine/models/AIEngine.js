import AIServiceClient from "../clients/AIServiceClient.js";

class AIEngine {
    constructor(engineId, version, modelType, status = 1) {
        this.engineId = engineId;
        this.version = version;
        this.modelType = modelType;
        this.lastRunDate = null;
        this.status = status;

        this.aiClient = new AIServiceClient();
    }

    async generateSeating(data) {
        this.lastRunDate = new Date();

        return await this.aiClient.generateSeating(
            data,
            this.modelType
        );
    }

    async generateRunningOrder(data) {
        this.lastRunDate = new Date();

        return await this.aiClient.generateRunningOrder(
            data,
            this.modelType
        );
    }

    async suggestTrafficFlow(data) {
        this.lastRunDate = new Date();

        return await this.aiClient.suggestTrafficFlow(
            data,
            this.modelType
        );
    }

    activate() {
        this.status = 1;
    }

    deactivate() {
        this.status = 0;
    }
}

export default AIEngine;