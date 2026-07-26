// Tools for the master vip_profiles directory — the permanent record of a
// person (name, title, org, contact). Distinct from the per-event `vips`
// JSONB list in vipEventTools.js, which is just a display/seating order.

export const declarations = [
    {
        name: "search_vip_directory",
        description: "Search the master directory of VIPs/people by name, title, or email.",
        parameters: {
            type: "OBJECT",
            properties: { query: { type: "STRING" } },
            required: ["query"]
        }
    },
    {
        name: "create_vip_profile",
        description: "Create a new person in the master VIP/participant directory.",
        parameters: {
            type: "OBJECT",
            properties: {
                fullName: { type: "STRING" },
                honorificTitle: { type: "STRING" },
                positionTitle: { type: "STRING" },
                district: { type: "STRING" },
                vipCategory: { type: "STRING", enum: ["royalty", "vvip", "vip", "official", "guest"] },
                phone: { type: "STRING" },
                email: { type: "STRING" },
                notes: { type: "STRING" }
            },
            required: ["fullName"]
        }
    },
    {
        name: "update_vip_profile",
        description: "Change fields on an existing person in the master VIP/participant directory. Only send fields that should change.",
        parameters: {
            type: "OBJECT",
            properties: {
                vipId: { type: "INTEGER", description: "The vip_id to update. Resolve it with search_vip_directory first if you only have a name." },
                fullName: { type: "STRING" },
                honorificTitle: { type: "STRING" },
                positionTitle: { type: "STRING" },
                district: { type: "STRING" },
                vipCategory: { type: "STRING", enum: ["royalty", "vvip", "vip", "official", "guest"] },
                phone: { type: "STRING" },
                email: { type: "STRING" },
                notes: { type: "STRING" }
            },
            required: ["vipId"]
        }
    }
];

export const handlers = {

    async search_vip_directory(args, context) {
        const { vipRepository } = context.repositories;
        const matches = await vipRepository.searchVIPs(args.query || "");

        if (matches.length === 0) {
            return { ok: true, reply: `No one in the directory matches "${args.query}".` };
        }

        const summary = matches
            .slice(0, 10)
            .map((m) => `${m.full_name} (${m.position_title || m.vip_category}, id ${m.vip_id})`)
            .join("; ");

        return { ok: true, reply: `Found: ${summary}` };
    },

    async create_vip_profile(args, context) {
        const { vipRepository } = context.repositories;

        if (!args.fullName || !String(args.fullName).trim()) {
            return { ok: false, reply: "I need a full name to create a VIP profile." };
        }

        const vip = await vipRepository.createVIP({ ...args, fullName: String(args.fullName).trim() });

        return { ok: true, persisted: true, reply: `Added ${vip.full_name} to the VIP directory (id ${vip.vip_id}).` };
    },

    async update_vip_profile(args, context) {
        const { vipRepository } = context.repositories;

        if (!args.vipId) {
            return { ok: false, reply: "I need a vipId — use search_vip_directory first if you only have a name." };
        }

        const fields = { ...args };
        delete fields.vipId;

        const vip = await vipRepository.updateVIP(args.vipId, fields);

        if (!vip) {
            return { ok: false, reply: `No VIP found with id ${args.vipId}.` };
        }

        return { ok: true, persisted: true, reply: `Updated ${vip.full_name}.` };
    }

};
