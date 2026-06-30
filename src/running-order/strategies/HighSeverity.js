import ConflictResolutionStrategy from "../interfaces/ConflictResolutionStrategy.js";

class HighSeverity extends ConflictResolutionStrategy {
    constructor() {
        super(
            1,
            "HIGH_SEVERITY"
        );
    }

    resolveConflict(conflict) {
        console.log(
            `Resolving HIGH severity conflict ${conflict.conflictId}`
        );

        this.lockSchedule();

        this.escalateIssue();

        this.notifyCommittee();

        return {
            success: true,
            severity: "HIGH",
            conflictId: conflict.conflictId,
            description: conflict.description
        };
    }

    lockSchedule() {
        console.log(
            "Schedule locked."
        );
    }

    escalateIssue() {
        console.log(
            "Issue escalated."
        );
    }

    notifyCommittee() {
        console.log(
            "Committee notified."
        );
    }
}

export default HighSeverity;