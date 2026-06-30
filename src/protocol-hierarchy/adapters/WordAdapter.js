import ProtocolParser

from "./ProtocolParser.js";


import WordReader

from "../readers/WordReader.js";


import ProtocolRule

from "../models/ProtocolRule.js";


class WordAdapter

extends ProtocolParser {



    constructor() {

        super();

        this.wordReader =

        new WordReader();

    }



    parse(filePath) {


        const rawData =

        this.wordReader

        .readWordFile(

            filePath

        );



        return new ProtocolRule(

            rawData.ruleId,

            rawData.description,

            rawData.category

        );

    }


}


export default WordAdapter;