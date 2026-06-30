class AIModelConfig {
    constructor(configId, modelName, temperature, maxTokens) {
        this.configId = configId;
        this.modelName = modelName;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
    }
}

export default AIModelConfig;