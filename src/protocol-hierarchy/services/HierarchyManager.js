class HierarchyManager {

    constructor() {

        this.observers = [];

    }


    attachObserver(observer) {

        this.observers.push(

            observer

        );

    }


    detachObserver(observer) {

        this.observers =

        this.observers.filter(

            o => o !== observer

        );

    }


    notifyObserver() {

        this.observers

        .forEach(

            observer =>

            observer.update()

        );

    }


    updateGuestHierarchy() {

        console.log(

            "Updating Guest Hierarchy..."

        );


        /*
        hierarchy logic

        rank comparison

        tree reconstruction

        etc
        */


        this.notifyObserver();

    }

}

export default HierarchyManager;