import EventUpdateService from "../services/EventUpdateService.js";
import EmergencyProtocolService from "../services/EmergencyProtocolService.js";
import TrafficFlowService from "../services/TrafficFlowService.js";
import StageOrderService from "../services/StageOrderService.js";

class RealTimeOperationsFacade {

    constructor() {

        this.eventUpdateService =
            new EventUpdateService();

        this.emergencyProtocolService =
            new EmergencyProtocolService();

        this.trafficFlowService =
            new TrafficFlowService();

        this.stageOrderService =
            new StageOrderService();

    }


    pushUpdate(
        message,
        updateManager
    ) {

        return this.eventUpdateService
            .pushRealTimeUpdate(
                message,
                updateManager
            );

    }


    handleEmergency(
        template
    ) {

        return this.emergencyProtocolService
            .handleEmergency(
                template
            );

    }


    manageTraffic() {

        return this.trafficFlowService
            .manageTraffic();

    }


    manageStageOrder() {

        return this.stageOrderService
            .updateStageOrder();

    }

}

export default RealTimeOperationsFacade;