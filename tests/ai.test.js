import AIModelConfig from "../src/ai-engine/models/AIModelConfig.js";
import AIEngineFactory from "../src/ai-engine/factories/AIEngineFactory.js";

console.log("AI test started");


const config = new AIModelConfig(
    1,
    "gemini-2.5-flash",
    1,
    8000
);

console.log(config);


const factory = new AIEngineFactory();

console.log(factory);


const engine = factory.createEngine(config);

console.log(engine);


console.log("AI test finished");