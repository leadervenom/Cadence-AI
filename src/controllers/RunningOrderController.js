class RunningOrderController {

    getStatus(req,res){

        res.json({

            module:"Running Order",

            status:"ACTIVE"

        });

    }

}

export default RunningOrderController;