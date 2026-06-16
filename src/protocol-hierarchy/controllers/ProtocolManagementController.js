class ProtocolManagementController {


    constructor(
        protocolManagementService
    ) {

        this.protocolManagementService =
        protocolManagementService;

    }


    uploadDocument =
    (req,res) => {


        try {

            const {

                fileType,

                fileName

            }

            = req.body;



            const document =

            this
            .protocolManagementService

            .uploadDocument(

                fileType,

                fileName

            );



            return res
            .status(201)
            .json(document);


        }


        catch(error) {

            return res

            .status(500)

            .json({

                message:error.message

            });

        }


    }

    parseDocument =

    (req,res) => {


        try {


            const {

                fileType,

                filePath

            }

            = req.body;



            const protocolRule =

            this

            .protocolManagementService

            .parseProtocolDocument(

                fileType,

                filePath

            );



            return res

            .status(200)

            .json(

                protocolRule

            );


        }


        catch(error) {


            return res

            .status(500)

            .json({

                message:

                error.message

            });

        }


    }

}

export default ProtocolManagementController;