class EmergencyProtocolTemplate {
    constructor(
        templateId,
        protocolType,
        severityLevel,
        description
    ) {
        this.templateId = templateId;
        this.protocolType = protocolType;
        this.severityLevel = severityLevel;
        this.description = description;
    }
}

export default EmergencyProtocolTemplate;