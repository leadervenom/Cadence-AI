import RealTimeOperationsFacade from "../src/realtime-operations/facades/RealTimeOperationsFacade.js";

console.log("Test started");

const facade = new RealTimeOperationsFacade();

facade.manageTraffic();

facade.manageStageOrder();

console.log("Test finished");