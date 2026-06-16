import crypto from "crypto";

import ProtocolFactory from "./ProtocolFactory.js";

import ProtocolDocument
from "../models/ProtocolDocument.js";


class PdfProtocolFactory
extends ProtocolFactory {


    createDocument(fileName) {

        const document =
        new ProtocolDocument(

            crypto.randomUUID(),

            fileName,

            "PDF"

        );


        document.status = "CREATED";


        return document;

    }


}

export default PdfProtocolFactory;