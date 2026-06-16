class Conflict {
    constructor(
        conflictId,
        description,
        severity
    ) {
        this.conflictId = conflictId;
        this.description = description;
        this.detectedAt = new Date();
        this.severity = severity;
    }
}

export default Conflict;