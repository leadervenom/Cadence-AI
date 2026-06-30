class RealTimeController {

    getStatus(req,res){

        res.json({

            module:"Realtime Operations",

            status:"ACTIVE"

        });

    }

}

export default RealTimeController;