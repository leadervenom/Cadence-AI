import WordProtocolFactory from "../src/protocol-hierarchy/factories/WordProtocolFactory.js";

const factory = new WordProtocolFactory();

const protocol = factory.createProtocol(
    1,
    "Graduation Ceremony",
    "Guests must arrive 30 minutes early."
);

console.log(protocol);