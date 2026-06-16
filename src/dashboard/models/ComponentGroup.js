import DashboardElement from "../interfaces/DashboardElement.js";

class ComponentGroup extends DashboardElement {

    constructor(
        groupId,
        groupName,
        description
    ) {

        super();

        this.groupId = groupId;

        this.groupName = groupName;

        this.description = description;

        this.dateCreated = new Date();

        this.elements = [];

    }


    addElement(element) {

        this.elements.push(

            element

        );

    }


    removeElement(element) {

        this.elements =

            this.elements.filter(

                e => e !== element

            );

    }


    drawElement() {

        console.log(

            `Drawing Group:

            ${this.groupName}`

        );


        this.elements.forEach(

            element =>

            element.drawElement()

        );

    }

}

export default ComponentGroup;