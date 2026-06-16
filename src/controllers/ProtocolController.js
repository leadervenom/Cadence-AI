class ProtocolController {

    getStatus(req,res){

        res.json({

            module:"Protocol Hierarchy",

            status:"ACTIVE"

        });

    }

}

export default ProtocolController;