import VIPProfileRepository from "../repositories/VIPProfileRepository.js";

class VIPController {

    constructor() {
        this.vipRepository = new VIPProfileRepository();
    }

    getAllVIPs = async (req, res) => {
        const vips = await this.vipRepository.getAllVIPs();
        res.json(vips);
    };


    searchVIPs = async (req, res) => {
        const q = String(req.query.q || "").trim();

        if (!q) {
            return res.json([]);
        }

        const vips = await this.vipRepository.searchVIPs(q);
        res.json(vips);
    };


    getVIPById = async (req, res) => {
        const vip = await this.vipRepository.getVIPById(req.params.id);

        if (!vip) {
            return res.status(404).json({ error: "VIP not found" });
        }

        res.json(vip);
    };


    createVIP = async (req, res) => {
        const { fullName, honorificTitle, positionTitle, organizationId, district, vipCategory, phone, email, notes } = req.body || {};

        if (!fullName || !String(fullName).trim()) {
            return res.status(400).json({ error: "fullName is required" });
        }

        const vip = await this.vipRepository.createVIP({
            fullName: String(fullName).trim(),
            honorificTitle,
            positionTitle,
            organizationId,
            district,
            vipCategory,
            phone,
            email,
            notes
        });

        res.status(201).json(vip);
    };


    updateVIP = async (req, res) => {
        const existing = await this.vipRepository.getVIPById(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: "VIP not found" });
        }

        const { fullName, honorificTitle, positionTitle, organizationId, district, vipCategory, phone, email, notes } = req.body || {};
        const fields = {};

        if (fullName !== undefined) fields.fullName = String(fullName).trim();
        if (honorificTitle !== undefined) fields.honorificTitle = honorificTitle;
        if (positionTitle !== undefined) fields.positionTitle = positionTitle;
        if (organizationId !== undefined) fields.organizationId = organizationId;
        if (district !== undefined) fields.district = district;
        if (vipCategory !== undefined) fields.vipCategory = vipCategory;
        if (phone !== undefined) fields.phone = phone;
        if (email !== undefined) fields.email = email;
        if (notes !== undefined) fields.notes = notes;

        const vip = await this.vipRepository.updateVIP(req.params.id, fields);

        res.json(vip);
    };


    deleteVIP = async (req, res) => {
        const deactivated = await this.vipRepository.deactivateVIP(req.params.id);

        if (!deactivated) {
            return res.status(404).json({ error: "VIP not found" });
        }

        res.status(204).end();
    };

}

export default VIPController;
