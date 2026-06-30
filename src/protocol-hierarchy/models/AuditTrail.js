import Observer from "../interfaces/Observer.js";

class AuditTrail extends Observer {

    constructor(logId) {

        super();

        this.logId = logId;

        this.timestamp = new Date();

        this.action = "";

    }


    update() {

        this.recordChange(

            "Hierarchy Updated"

        );

    }


    recordChange(action) {

        this.action = action;

        this.timestamp = new Date();


        console.log(

            `[AUDIT]

            ${this.action}

            at

            ${this.timestamp}`

        );

    }

}

export default AuditTrail;