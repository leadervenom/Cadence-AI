import EventUpdate from "../models/EventUpdate.js";

class EventUpdateService {

    pushRealTimeUpdate(

        message,

        updateManager

    ) {


        const eventUpdate =

            new EventUpdate(

                Date.now().toString(),

                message,

                "ACTIVE"

            );


        updateManager

            .notifyObserver(

                eventUpdate

            );


        return eventUpdate;

    }

}

export default EventUpdateService;