import * as runningOrderTools from "./runningOrderTools.js";
import * as vipEventTools from "./vipEventTools.js";
import * as seatingTools from "./seatingTools.js";
import * as sourceTools from "./sourceTools.js";
import * as eventMetadataTools from "./eventMetadataTools.js";
import * as vipDirectoryTools from "./vipDirectoryTools.js";
import * as vipRankingTools from "./vipRankingTools.js";
import * as rsvpTools from "./rsvpTools.js";

const MODULES = [
    runningOrderTools,
    vipEventTools,
    seatingTools,
    sourceTools,
    eventMetadataTools,
    vipDirectoryTools,
    vipRankingTools,
    rsvpTools
];

export const allDeclarations = MODULES.flatMap((mod) => mod.declarations);

const handlerByName = MODULES.reduce(
    (map, mod) => Object.assign(map, mod.handlers),
    {}
);

// Normalize e.g. "ReplaceRunningOrderItems" and "replace_running_order" to the
// same "replace_running_order" form so a close-but-wrong tool name from the
// model can still be resolved instead of failing the turn outright.
function normalizeToolName(name) {
    return String(name)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .toLowerCase()
        .replace(/^_+|_+$/g, "");
}

const knownToolNames = Object.keys(handlerByName);
const normalizedToKnownName = knownToolNames.reduce((map, known) => {
    map[normalizeToolName(known)] = known;
    return map;
}, {});

// Resolves a possibly-hallucinated tool name to a real one: exact match first,
// then normalized exact match, then normalized prefix match (only when exactly
// one known tool qualifies, to avoid guessing between ambiguous candidates).
function resolveToolName(name) {
    if (handlerByName[name]) return name;

    const normalized = normalizeToolName(name);

    if (normalizedToKnownName[normalized]) return normalizedToKnownName[normalized];

    const prefixMatches = knownToolNames.filter((known) => {
        const normalizedKnown = normalizeToolName(known);
        return normalized.startsWith(normalizedKnown) || normalizedKnown.startsWith(normalized);
    });

    return prefixMatches.length === 1 ? prefixMatches[0] : null;
}

export async function dispatch(name, args, context) {
    const resolvedName = resolveToolName(name);
    const handler = resolvedName && handlerByName[resolvedName];

    if (!handler) {
        return { ok: false, reply: `I tried to call an unknown tool '${name}'.` };
    }

    return handler(args || {}, context);
}
