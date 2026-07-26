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

export async function dispatch(name, args, context) {
    const handler = handlerByName[name];

    if (!handler) {
        return { ok: false, reply: `I tried to call an unknown tool '${name}'.` };
    }

    return handler(args || {}, context);
}
