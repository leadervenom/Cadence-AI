import Observer from "../interfaces/Observer.js";

class SeatingArrangement extends Observer {

    constructor(seatingId) {
        super();

        this.seatingId = seatingId;

        this.status = "ACTIVE";

        this.generatedDate = new Date();
    }


    update() {

        console.log(

            "Hierarchy changed."

        );

        this.regenerate();

    }


    regenerate() {

        this.generatedDate = new Date();

        console.log(

            `Seating arrangement

            ${this.seatingId}

            regenerated.`

        );

    }

}

export default SeatingArrangement;