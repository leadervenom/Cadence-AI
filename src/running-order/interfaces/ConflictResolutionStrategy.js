class ConflictResolutionStrategy {
    constructor(
        resolutionId,
        resolutionMethod
    ) {
        this.resolutionId = resolutionId;

        this.resolutionMethod = resolutionMethod;
    }

    resolveConflict(conflict) {
        throw new Error(
            "resolveConflict() must be implemented."
        );
    }
}

export default ConflictResolutionStrategy;