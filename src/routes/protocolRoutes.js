import express from "express";

const router = express.Router();


router.get(

    "/",

    (

        req,

        res

    ) => {

        res.json({

            module:

            "Protocol Hierarchy",

            status:

            "ACTIVE"

        });

    }

);


export default router;