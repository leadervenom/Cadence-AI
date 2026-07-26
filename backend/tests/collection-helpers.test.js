import assert from "node:assert/strict";
import {
    getCollection,
    setCollection,
    backfillIds,
    appendItem,
    updateItem,
    deleteItem,
    replaceSection
} from "../src/ai-engine/tools/collectionHelpers.js";

const event = {
    id: 10,
    name: "Protocol Briefing",
    running_order: [
        {
            id: "ro-10-0",
            time: "09:00-09:15",
            dur: "15m",
            activity: "Arrival",
            loc: "Lobby",
            role: "Protocol Officer",
            status: "pending"
        }
    ],
    seating: {
        layouts: [
            { id: "layout-1", name: "Main Layout", rows: [] }
        ],
        activeLayoutId: "layout-1"
    }
};

// getCollection / setCollection: plain array section vs. nested (seating.layouts).
assert.equal(getCollection(event, "running_order").length, 1);
assert.equal(getCollection(event, "seating").length, 1);
assert.equal(getCollection(event, "seating")[0].id, "layout-1");

// append: array section, does not mutate the original event, assigns an id.
const { updatedEvent: afterAppend, item: appended } = appendItem(event, "running_order", {
    time: "09:15-09:30",
    dur: "15m",
    activity: "Safety Briefing",
    loc: "Hall",
    role: "Security Lead",
    status: "pending"
});

assert.equal(afterAppend.running_order.length, 2);
assert.equal(event.running_order.length, 1);
assert.ok(appended.id);

// update: change one field on the existing running_order row by id, does not mutate original.
const { updatedEvent: afterUpdate, item: updated } = updateItem(afterAppend, "running_order", "ro-10-0", { status: "on-air" });

assert.equal(afterUpdate.running_order[0].status, "on-air");
assert.equal(afterUpdate.running_order[0].id, "ro-10-0");
assert.equal(afterAppend.running_order[0].status, "pending");
assert.equal(updated.status, "on-air");

// update with an unknown itemId returns null and the untouched event.
const { item: missing, updatedEvent: unchanged } = updateItem(afterAppend, "running_order", "does-not-exist", { status: "on-air" });

assert.equal(missing, null);
assert.equal(unchanged, afterAppend);

// delete: remove the existing running_order row by id, does not mutate original.
const { updatedEvent: afterDelete, found } = deleteItem(afterUpdate, "running_order", "ro-10-0");

assert.equal(found, true);
assert.equal(afterDelete.running_order.length, 1);
assert.equal(afterUpdate.running_order.length, 2);

// append a new layout to seating (nested collection) — backend assigns the id.
const { updatedEvent: afterLayoutAppend, item: newLayout } = appendItem(event, "seating", { name: "Theatre Seating", rows: [] });

assert.equal(afterLayoutAppend.seating.layouts.length, 2);
assert.ok(newLayout.id);
assert.notEqual(newLayout.id, "layout-1");
assert.equal(event.seating.layouts.length, 1);

// delete the active layout — activeLayoutId must fall back to a remaining layout.
const { updatedEvent: afterLayoutDelete } = deleteItem(afterLayoutAppend, "seating", "layout-1");

assert.equal(afterLayoutDelete.seating.layouts.length, 1);
assert.notEqual(afterLayoutDelete.seating.activeLayoutId, "layout-1");

// replace: whole array section, backfills ids on items that don't have one.
const { updatedEvent: afterReplace } = replaceSection(event, "running_order", [
    { time: "10:00", activity: "Opening" },
    { id: "existing-id", time: "10:30", activity: "Keynote" }
]);

assert.equal(afterReplace.running_order.length, 2);
assert.ok(afterReplace.running_order[0].id);
assert.equal(afterReplace.running_order[1].id, "existing-id");

// setCollection / backfillIds directly.
const bare = { running_order: [{ activity: "No id yet" }] };

backfillIds(bare, "running_order");
assert.ok(bare.running_order[0].id);

setCollection(bare, "running_order", []);
assert.equal(bare.running_order.length, 0);

console.log("collection-helpers test passed");
