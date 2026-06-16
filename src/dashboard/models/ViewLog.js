class ViewLog {

    constructor(

        logId,

        accessAction,

        accessedBy,

        accessTimeStamp,

        deviceType

    ) {

        this.logId = logId;

        this.accessAction = accessAction;

        this.accessedBy = accessedBy;

        this.accessTimeStamp = accessTimeStamp;

        this.deviceType = deviceType;

    }

}

export default ViewLog;