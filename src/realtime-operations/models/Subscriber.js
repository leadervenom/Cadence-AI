import Observer from "../interfaces/Observer.js";

class Subscriber extends Observer {

    constructor(
        userId,
        role
    ) {

        super();

        this.userId = userId;

        this.role = role;

        this.notificationStatus = "ACTIVE";

    }


    update(eventUpdate) {

        console.log(

            `[${this.role}] ${eventUpdate.message}`

        );

    }

}

export default Subscriber;