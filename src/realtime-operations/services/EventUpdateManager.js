class EventUpdateManager {

    constructor() {

        this.observers = [];

    }


    attachObserver(observer) {

        this.observers.push(observer);

    }


    detachObserver(observer) {

        this.observers =

            this.observers.filter(

                o => o !== observer

            );

    }


    notifyObserver(eventUpdate) {

        this.observers.forEach(

            observer =>

            observer.update(

                eventUpdate

            )

        );

    }

}

export default EventUpdateManager;