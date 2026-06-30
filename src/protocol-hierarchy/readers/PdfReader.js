import crypto from "crypto";

import ProtocolRule

from "../models/ProtocolRule.js";


class PdfReader {


    readPdfFile(filePath) {


        console.log(

            `Reading PDF file:

            ${filePath}`

        );


        return {

            ruleId:

            crypto.randomUUID(),

            description:

            "PDF Parsed Rule",


            category:

            "PROTOCOL"

        };


    }


}


export default PdfReader;