class ProtocolDocument {

    constructor(documentId, fileName, fileType) {

        this.documentId = documentId;
        this.fileName = fileName;
        this.fileType = fileType;

        this.status = "NEW";
    }


    validate() {

        if (
            !this.documentId ||
            !this.fileName ||
            !this.fileType
        ) {

            return false;
        }

        return true;
    }


    parse() {

        console.log(
            `Parsing ${this.fileType} file ${this.fileName}`
        );

    }

}

export default ProtocolDocument;