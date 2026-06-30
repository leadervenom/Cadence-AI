import crypto from "crypto";

import ProtocolRule

from "../models/ProtocolRule.js";


class WordReader {


    readWordFile(filePath) {


        console.log(

            `Reading Word file:

            ${filePath}`

        );


        return {

            ruleId:

            crypto.randomUUID(),

            description:

            "Word Parsed Rule",


            category:

            "SEATING"

        };


    }


}


export default WordReader;