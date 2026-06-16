import DashboardElement from "../interfaces/DashboardElement.js";

class SimpleWidget extends DashboardElement {

    constructor(
        componentId,
        fileName,
        layoutSpan
    ) {

        super(

            componentId,

            fileName,

            layoutSpan,

            new Date(),

            1

        );

    }


    drawElement() {

        console.log(

            `Widget:

            ${this.fileName}`

        );

    }

}

export default SimpleWidget;