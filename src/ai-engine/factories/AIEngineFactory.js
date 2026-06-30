import AIEngine from "../models/AIEngine.js";

class AIEngineFactory {

    createEngine(config) {

        return new AIEngine(
            Date.now(),
            1,
            config.modelName,
            1
        );

    }

}

export default AIEngineFactory;