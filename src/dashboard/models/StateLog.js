class StateLog {

    constructor(

        logId,

        changeContext,

        triggeredBy,

        networkLatency

    ) {

        this.logId = logId;

        this.changeContext = changeContext;

        this.triggeredBy = triggeredBy;

        this.broadcastTimeStamp =

            new Date();

        this.networkLatency =

            networkLatency;

    }

}

export default StateLog;