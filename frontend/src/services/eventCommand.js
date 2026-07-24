const ARRAY_SECTIONS = new Set([
  "running_order",
  "vips",
  "sources",
]);

// Sections whose editable items live nested one level in (seating.layouts)
// rather than at the section root. Keeps append/update/delete generic
// across both shapes. Mirrors backend/src/ai-engine/services/StructuredCommandService.js.
const NESTED_COLLECTIONS = {
  seating: "layouts",
};

const ITEM_SECTIONS = new Set([...ARRAY_SECTIONS, ...Object.keys(NESTED_COLLECTIONS)]);

const OBJECT_SECTIONS = new Set([
  "seating",
]);

function getCollection(event, section) {
  if (ARRAY_SECTIONS.has(section)) {
    return Array.isArray(event[section]) ? event[section] : [];
  }

  const key = NESTED_COLLECTIONS[section];
  const collection = event[section]?.[key];

  return Array.isArray(collection) ? collection : [];
}

function setCollection(event, section, items) {
  if (ARRAY_SECTIONS.has(section)) {
    event[section] = items;
    return;
  }

  const key = NESTED_COLLECTIONS[section];
  event[section] = {
    ...(event[section] || {}),
    [key]: items,
  };
}

export function applyEventCommand(event, command) {
  if (!event || command?.action !== "update_event_section") {
    return event;
  }

  const section = command.target?.section;
  const itemId = command.target?.itemId;
  const operation = command.operation;

  if (!section) {
    return event;
  }

  const updatedEvent = structuredClone(event);

  if (operation === "replace") {
    updatedEvent[section] = command.payload;
    return updatedEvent;
  }

  if (operation === "merge" && OBJECT_SECTIONS.has(section)) {
    updatedEvent[section] = {
      ...(updatedEvent[section] || {}),
      ...command.payload,
    };
    return updatedEvent;
  }

  if (operation === "append" && ITEM_SECTIONS.has(section)) {
    const items = getCollection(updatedEvent, section);
    const incoming = Array.isArray(command.payload) ? command.payload : [command.payload];
    const newItems = incoming.map((item) => ({
      ...item,
      id: item?.id || crypto.randomUUID(),
    }));

    setCollection(updatedEvent, section, items.concat(newItems));

    if (section === "seating" && !updatedEvent.seating.activeLayoutId && newItems[0]) {
      updatedEvent.seating.activeLayoutId = newItems[0].id;
    }

    return updatedEvent;
  }

  if (operation === "update" && ITEM_SECTIONS.has(section)) {
    const items = getCollection(updatedEvent, section);
    const index = items.findIndex((item) => item?.id === itemId);

    if (index !== -1) {
      items[index] = { ...items[index], ...command.payload, id: items[index].id };
      setCollection(updatedEvent, section, items);
    }

    return updatedEvent;
  }

  if (operation === "delete" && ITEM_SECTIONS.has(section)) {
    const items = getCollection(updatedEvent, section);
    const remaining = items.filter((item) => item?.id !== itemId);

    setCollection(updatedEvent, section, remaining);

    if (section === "seating") {
      const activeStillExists = remaining.some(
        (layout) => layout.id === updatedEvent.seating.activeLayoutId
      );

      if (!activeStillExists) {
        updatedEvent.seating.activeLayoutId = remaining[0]?.id || null;
      }
    }

    return updatedEvent;
  }

  return updatedEvent;
}
