import PdfProtocolFactory
from "../factories/PdfProtocolFactory.js";

import WordProtocolFactory
from "../factories/WordProtocolFactory.js";

import WordAdapter
from "../adapters/WordAdapter.js";


import PdfAdapter
from "../adapters/PdfAdapter.js";

class ProtocolManagementService {


    uploadDocument(
        fileType,
        fileName
    ) {

        let factory;


        switch(fileType.toUpperCase()) {


            case "PDF":

                factory =
                new PdfProtocolFactory();

                break;



            case "WORD":

                factory =
                new WordProtocolFactory();

                break;


            default:

                throw new Error(
                    "Unsupported file type"
                );

        }


        const document =

        factory.createDocument(
            fileName
        );


        if(
            !document.validate()
        ) {

            throw new Error(
                "Invalid document"
            );

        }


        document.parse();


        return document;

    }

    parseProtocolDocument(

        fileType,

        filePath

    ) {


        let parser;


        switch(

            fileType

            .toUpperCase()

        ) {


            case "WORD":

                parser =

                new WordAdapter();

                break;



            case "PDF":

                parser =

                new PdfAdapter();

                break;



            default:

                throw new Error(

                    "Unsupported file type"

                );

        }


        const protocolRule =

        parser.parse(

            filePath

        );



        protocolRule

        .applyRule();



        return protocolRule;

    }   

}

export default ProtocolManagementService;