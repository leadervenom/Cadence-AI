import ProtocolParser

from "./ProtocolParser.js";


import PdfReader

from "../readers/PdfReader.js";


import ProtocolRule

from "../models/ProtocolRule.js";


class PdfAdapter

extends ProtocolParser {



    constructor() {

        super();

        this.pdfReader =

        new PdfReader();

    }



    parse(filePath) {


        const rawData =

        this.pdfReader

        .readPdfFile(

            filePath

        );



        return new ProtocolRule(

            rawData.ruleId,

            rawData.description,

            rawData.category

        );


    }


}


export default PdfAdapter;