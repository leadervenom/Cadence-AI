import express from "express";
import EventWorkspaceRepository from "../repositories/EventWorkspaceRepository.js";

const router = express.Router();
const repository = new EventWorkspaceRepository();

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

router.get(
  "/",
  asyncRoute(async (req, res) => {
    res.json(await repository.listEvents());
  })
);

router.post(
  "/",
  asyncRoute(async (req, res) => {
    if (!req.body?.name?.trim()) {
      res.status(400).json({ error: "Event name is required" });
      return;
    }

    const event = await repository.createEvent(req.body);
    res.status(201).json(event);
  })
);

router.get(
  "/:eventId",
  asyncRoute(async (req, res) => {
    const event = await repository.getEvent(Number(req.params.eventId));
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(event);
  })
);

router.post(
  "/:eventId/documents",
  asyncRoute(async (req, res) => {
    if (!req.body?.name?.trim()) {
      res.status(400).json({ error: "Document name is required" });
      return;
    }

    const document = await repository.createDocument(
      Number(req.params.eventId),
      req.body
    );
    res.status(201).json(document);
  })
);

router.put(
  "/:eventId/extractions/:type",
  asyncRoute(async (req, res) => {
    const type = req.params.type;
    const event = await repository.upsertExtraction(
      Number(req.params.eventId),
      type,
      req.body?.data
    );
    res.json(event);
  })
);

router.put(
  "/:eventId/vips",
  asyncRoute(async (req, res) => {
    const event = await repository.replaceEventVips(
      Number(req.params.eventId),
      req.body?.vips || []
    );
    res.json(event);
  })
);

export default router;
