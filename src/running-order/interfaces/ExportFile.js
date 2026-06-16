class ExportFile {
    constructor(
        fileID,
        fileName,
        fileType,
        exportDate,
        status
    ) {
        this.fileID = fileID;
        this.fileName = fileName;
        this.fileType = fileType;
        this.exportDate = exportDate;
        this.status = status;
    }

    export() {
        throw new Error(
            "export() must be implemented."
        );
    }
}

export default ExportFile;