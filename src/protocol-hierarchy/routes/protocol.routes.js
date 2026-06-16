import express from "express";

const router = express.Router();


router.post(

"/upload",

protocolManagementController

.uploadDocument

);

router.post(

"/parse",

protocolManagementController

.parseDocument

);

export default router;