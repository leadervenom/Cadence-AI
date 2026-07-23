import assert from "node:assert/strict";
import StructuredCommandService from "../src/ai-engine/services/StructuredCommandService.js";

const service = new StructuredCommandService();

const event = {
    id: 10,
    name: "Protocol Briefing",
    running_order: [
        {
            time:"09:00-09:15",
            dur:"15m",
            activity:"Arrival",
            loc:"Lobby",
            role:"Protocol Officer",
            status:"pending"
        }
    ]
};

const appendCommand = service.normalize({
    reply:"Added the briefing slot.",
    command:{
        version:"1.0",
        action:"update_event_section",
        target:{
            eventId:10,
            section:"running_order"
        },
        operation:"append",
        payload:{
            time:"09:15-09:30",
            dur:"15m",
            activity:"Safety Briefing",
            loc:"Hall",
            role:"Security Lead",
            status:"pending"
        },
        reason:"User requested a new running order item."
    }
});

const appendResult = service.apply(appendCommand, event);

assert.equal(appendResult.validation.valid, true);
assert.equal(appendResult.applied, true);
assert.equal(appendResult.event.running_order.length, 2);
assert.equal(event.running_order.length, 1);

const invalidCommand = service.normalize({
    reply:"Invalid command.",
    command:{
        action:"update_event_section",
        target:{
            eventId:10,
            section:"traffic"
        },
        operation:"replace",
        payload:[
            "A",
            "B",
            "C"
        ]
    }
});

const invalidResult = service.apply(invalidCommand, event);

assert.equal(invalidResult.validation.valid, false);
assert.equal(invalidResult.applied, false);
assert.match(
    invalidResult.validation.errors.join(" "),
    /Unsupported event section/
);

console.log("structured-command test passed");
