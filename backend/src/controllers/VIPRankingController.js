import VIPRankingRepository from "../repositories/VIPRankingRepository.js";
import VIPProfileRepository from "../repositories/VIPProfileRepository.js";

class VIPRankingController {

    constructor() {
        this.rankingRepository = new VIPRankingRepository();
        this.vipRepository = new VIPProfileRepository();
    }

    getRankings = async (req, res) => {
        const rankings = await this.rankingRepository.getCurrentRankings();
        res.json(rankings);
    };


    getTopVIPs = async (req, res) => {
        const limit = Number(req.query.limit) || 10;
        const rankings = await this.rankingRepository.getTopVIPs(limit);
        res.json(rankings);
    };


    setRanking = async (req, res) => {
        const { vipId, rankNumber, rankingScope, sourceName, notes } = req.body || {};

        if (!vipId || !Number.isInteger(Number(rankNumber))) {
            return res.status(400).json({ error: "vipId and rankNumber are required" });
        }

        const vip = await this.vipRepository.getVIPById(vipId);

        if (!vip) {
            return res.status(404).json({ error: "VIP not found" });
        }

        const ranking = await this.rankingRepository.setRanking({
            vipId,
            rankNumber: Number(rankNumber),
            rankingScope: rankingScope || undefined,
            sourceName,
            notes,
            createdBy: req.user?.id || null
        });

        res.status(201).json(ranking);
    };


    removeRanking = async (req, res) => {
        const removed = await this.rankingRepository.removeRanking(req.params.vipId, req.query.scope || undefined);

        if (!removed) {
            return res.status(404).json({ error: "No current ranking found for this VIP" });
        }

        res.status(204).end();
    };

}

export default VIPRankingController;
