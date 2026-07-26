export const declarations = [
    {
        name: "set_vip_ranking",
        description: "Set or change a VIP's official kekananan/ranking position. Retires whoever currently holds that rank number (or that VIP's previous rank) in the same scope.",
        parameters: {
            type: "OBJECT",
            properties: {
                vipId: { type: "INTEGER", description: "Resolve with search_vip_directory first if you only have a name." },
                rankNumber: { type: "INTEGER", description: "Lower number = higher precedence. Rank 1 is highest." },
                rankingScope: { type: "STRING", description: "Defaults to 'Johor State'." },
                sourceName: { type: "STRING", description: "Where this ranking comes from, e.g. a protocol document." },
                notes: { type: "STRING" }
            },
            required: ["vipId", "rankNumber"]
        }
    }
];

export const handlers = {

    async set_vip_ranking(args, context) {
        const { rankingRepository, vipRepository } = context.repositories;

        const vip = await vipRepository.getVIPById(args.vipId);

        if (!vip) {
            return { ok: false, reply: `No VIP found with id ${args.vipId}.` };
        }

        const ranking = await rankingRepository.setRanking({
            vipId: args.vipId,
            rankNumber: args.rankNumber,
            rankingScope: args.rankingScope || undefined,
            sourceName: args.sourceName,
            notes: args.notes,
            createdBy: context.userId || null
        });

        return {
            ok: true,
            persisted: true,
            reply: `Set ${vip.full_name} as rank ${ranking.rank_number} (${ranking.ranking_scope}).`
        };
    }

};
