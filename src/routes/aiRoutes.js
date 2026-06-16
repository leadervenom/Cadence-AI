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

            "AI Engine",

            status:

            "ACTIVE"

        });

    }

);


export default router;