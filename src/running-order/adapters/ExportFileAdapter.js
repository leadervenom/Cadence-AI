import ExportFile from "../interfaces/ExportFile.js";
import AuditLog from "../models/AuditLog.js";

class ExportFileAdapter extends ExportFile {

    constructor(
        fileID,
        fileName,
        fileType,
        exportTemplate
    ) {

        super(
            fileID,
            fileName,
            fileType,
            new Date(),
            1
        );

        this.exportTemplate = exportTemplate;
    }


    export() {

        console.log(
            `Exporting ${this.fileName}`
        );

        console.log(
            `Template: ${this.exportTemplate.templateName}`
        );


        const auditLog = new AuditLog(

            Date.now(),
            "EXPORT_FILE",
            1,

            `${this.fileName} exported successfully`

        );


        auditLog.record();

        return {
            success: true,
            fileID: this.fileID,
            fileName: this.fileName,
            fileType: this.fileType,
            template:

            this.exportTemplate.templateName
        };

    }

}

export default ExportFileAdapter;