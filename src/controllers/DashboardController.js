class DashboardController {

    getStatus(req,res){

        res.json({

            module:"Dashboard",

            status:"ACTIVE"

        });

    }

}

export default DashboardController;