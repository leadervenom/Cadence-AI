import EmergencyProtocol from "../models/EmergencyProtocol.js";

class EmergencyProtocolFactory {

    createProtocol(template) {

        return new EmergencyProtocol(

            Date.now().toString(),

            template.protocolType,

            "ACTIVE"

        );

    }

}

export default EmergencyProtocolFactory;