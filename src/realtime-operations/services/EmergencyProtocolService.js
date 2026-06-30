import EmergencyProtocolFactory from "../factories/EmergencyProtocolFactory.js";

class EmergencyProtocolService {

    constructor() {

        this.protocolFactory =
            new EmergencyProtocolFactory();

    }


    handleEmergency(template) {

        const protocol =
            this.protocolFactory
            .createProtocol(template);


        protocol.activate();

        return protocol;

    }

}

export default EmergencyProtocolService;