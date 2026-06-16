class EmergencyProtocol {
    constructor(
        protocolId,
        protocolName,
        status
    ) {
        this.protocolId = protocolId;
        this.protocolName = protocolName;
        this.status = status;
    }

    activate() {
        this.status = "ACTIVE";

        console.log(
            `${this.protocolName} activated`
        );
    }

    deactivate() {
        this.status = "INACTIVE";

        console.log(
            `${this.protocolName} deactivated`
        );
    }
}

export default EmergencyProtocol;