class ExportTemplate {
    constructor(
        templateId,
        templateName,
        description
    ) {
        this.templateId = templateId;

        this.templateName = templateName;

        this.description = description;

        this.createdDate = new Date();
    }
}

export default ExportTemplate;