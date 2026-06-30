import VIPProfileRepository from "../repositories/VIPProfileRepository.js";

class VIPController {

    constructor(){

        this.vipRepository =

        new VIPProfileRepository();

    }


    getAllVIPs = async (

        req,

        res

    ) => {

        try{

            const vips =

            await this.vipRepository

            .getAllVIPs();


            res.json(vips);

        }

        catch(error){

            console.error(error);

            res.status(500)

            .json({

                error:

                "Failed to fetch VIPs"

            });

        }

    };


    getVIPById = async (

        req,

        res

    ) => {

        try{

            const vip =

            await this.vipRepository

            .getVIPById(

                req.params.id

            );


            if(!vip){

                return res

                .status(404)

                .json({

                    error:

                    "VIP not found"

                });

            }


            res.json(vip);

        }

        catch(error){

            console.error(error);

            res.status(500)

            .json({

                error:

                "Server error"

            });

        }

    };

}

export default VIPController;