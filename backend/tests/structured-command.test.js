import assert from "node:assert/strict";
import StructuredCommandService from "../src/ai-engine/services/StructuredCommandService.js";

const service = new StructuredCommandService();

const event = {
    id: 10,
    name: "Protocol Briefing",
    running_order: [
        {
            id: "ro-10-0",
            time:"09:00-09:15",
            dur:"15m",
            activity:"Arrival",
            loc:"Lobby",
            role:"Protocol Officer",
            status:"pending"
        }
    ],
    seating: {
        layouts: [
            { id: "layout-1", name: "Main Layout", rows: [] }
        ],
        activeLayoutId: "layout-1"
    }
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

// update: change one field on the existing running_order row by id.
const updateCommand = service.normalize({
    reply:"Marked it on-air.",
    command:{
        action:"update_event_section",
        target:{
            eventId:10,
            section:"running_order",
            itemId:"ro-10-0"
        },
        operation:"update",
        payload:{ status:"on-air" },
        reason:"User requested a status change."
    }
});

const updateResult = service.apply(updateCommand, event);

assert.equal(updateResult.validation.valid, true);
assert.equal(updateResult.applied, true);
assert.equal(updateResult.event.running_order[0].status, "on-air");
assert.equal(updateResult.event.running_order[0].id, "ro-10-0");
assert.equal(event.running_order[0].status, "pending");

// delete: remove the existing running_order row by id.
const deleteCommand = service.normalize({
    reply:"Removed the row.",
    command:{
        action:"update_event_section",
        target:{
            eventId:10,
            section:"running_order",
            itemId:"ro-10-0"
        },
        operation:"delete",
        reason:"User requested removal."
    }
});

const deleteResult = service.apply(deleteCommand, event);

assert.equal(deleteResult.validation.valid, true);
assert.equal(deleteResult.applied, true);
assert.equal(deleteResult.event.running_order.length, 0);
assert.equal(event.running_order.length, 1);

// update with an unknown itemId must fail validation.
const badUpdateCommand = service.normalize({
    reply:"",
    command:{
        action:"update_event_section",
        target:{
            eventId:10,
            section:"running_order",
            itemId:"does-not-exist"
        },
        operation:"update",
        payload:{ status:"on-air" }
    }
});

const badUpdateResult = service.apply(badUpdateCommand, event);

assert.equal(badUpdateResult.validation.valid, false);
assert.equal(badUpdateResult.applied, false);

// append a new layout to seating (nested collection) — backend assigns the id.
const addLayoutCommand = service.normalize({
    reply:"Added a theatre layout.",
    command:{
        action:"update_event_section",
        target:{
            eventId:10,
            section:"seating"
        },
        operation:"append",
        payload:{ name:"Theatre Seating", rows:[] },
        reason:"User requested a second layout."
    }
});

const addLayoutResult = service.apply(addLayoutCommand, event);

assert.equal(addLayoutResult.validation.valid, true);
assert.equal(addLayoutResult.applied, true);
assert.equal(addLayoutResult.event.seating.layouts.length, 2);
assert.ok(addLayoutResult.event.seating.layouts[1].id);
assert.notEqual(addLayoutResult.event.seating.layouts[1].id, "layout-1");
assert.equal(event.seating.layouts.length, 1);

// delete the active layout — activeLayoutId must fall back to a remaining layout.
const deleteLayoutCommand = service.normalize({
    reply:"Removed the main layout.",
    command:{
        action:"update_event_section",
        target:{
            eventId:10,
            section:"seating",
            itemId:"layout-1"
        },
        operation:"delete",
        reason:"User requested removal."
    }
});

const deleteLayoutResult = service.apply(deleteLayoutCommand, addLayoutResult.event);

assert.equal(deleteLayoutResult.validation.valid, true);
assert.equal(deleteLayoutResult.applied, true);
assert.equal(deleteLayoutResult.event.seating.layouts.length, 1);
assert.notEqual(deleteLayoutResult.event.seating.activeLayoutId, "layout-1");

console.log("structured-command test passed");
