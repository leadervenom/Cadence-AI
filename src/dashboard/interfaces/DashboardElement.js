class DashboardElement {

    constructor(
        componentId,
        fileName,
        layoutSpan,
        lastUpdated,
        visibilityStatus
    ) {

        this.componentId = componentId;

        this.fileName = fileName;

        this.layoutSpan = layoutSpan;

        this.lastUpdated = lastUpdated;

        this.visibilityStatus = visibilityStatus;

    }


    drawElement() {

        throw new Error(

            "drawElement() must be implemented."

        );

    }

}

export default DashboardElement;