class AuditLog {
    constructor(
        logId,
        action,
        performedBy,
        details
    ) {
        this.logId = logId;

        this.action = action;

        this.performedBy = performedBy;

        this.details = details;

        this.timeStamp = new Date();
    }

    record() {
        console.log(
            `[AUDIT] ${this.action}`
        );
    }
}

export default AuditLog;