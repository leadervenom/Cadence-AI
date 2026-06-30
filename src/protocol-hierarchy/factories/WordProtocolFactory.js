import ProtocolDocument from "../models/ProtocolDocument.js";

class WordProtocolFactory {

    createProtocol(
        documentId,
        title,
        content
    ) {

        return new ProtocolDocument(
            documentId,
            title,
            content,
            "DOCX"
        );

    }

}

export default WordProtocolFactory;