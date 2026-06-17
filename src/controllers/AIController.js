class AIController {

    getStatus(req,res){

        res.json({

            module:"AI Engine",

            status:"ACTIVE"

        });

    }

}

export default AIController;