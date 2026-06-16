import ConflictResolutionStrategy from "../interfaces/ConflictResolutionStrategy.js";

class LowSeverity extends ConflictResolutionStrategy {
    constructor() {
        super(
            2,
            "LOW_SEVERITY"
        );
    }

    resolveConflict(conflict) {
        console.log(
            `Resolving LOW severity conflict ${conflict.conflictId}`
        );

        this.suggestAltSlot();

        this.notifyOfficer();

        return {
            success: true,
            severity: "LOW",
            conflictId: conflict.conflictId,
            description: conflict.description
        };
    }

    suggestAltSlot() {
        console.log(
            "Alternative slot suggested."
        );
    }

    notifyOfficer() {
        console.log(
            "Officer notified."
        );
    }
}

export default LowSeverity;