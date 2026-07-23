const ARRAY_SECTIONS = new Set([
  "running_order",
  "vips",
  "sources",
]);

const OBJECT_SECTIONS = new Set([
  "seating",
]);

export function applyEventCommand(event, command) {
  if (!event || command?.action !== "update_event_section") {
    return event;
  }

  const section = command.target?.section;
  const operation = command.operation;

  if (!section) {
    return event;
  }

  const updatedEvent = structuredClone(event);

  if (operation === "replace") {
    updatedEvent[section] = command.payload;
    return updatedEvent;
  }

  if (operation === "append" && ARRAY_SECTIONS.has(section)) {
    const current = Array.isArray(updatedEvent[section]) ? updatedEvent[section] : [];
    updatedEvent[section] = current.concat(command.payload);
    return updatedEvent;
  }

  if (operation === "merge" && OBJECT_SECTIONS.has(section)) {
    updatedEvent[section] = {
      ...(updatedEvent[section] || {}),
      ...command.payload,
    };
    return updatedEvent;
  }

  return updatedEvent;
}
