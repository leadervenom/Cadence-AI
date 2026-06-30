class EventStreamSubject {

    constructor(subjectId) {

        this.subjectId = subjectId;

        this.activeSegmentId = null;

        this.streamCursor = 0;

        this.lastBroadcast = null;

        this.observers = [];

    }


    attach(observer) {

        this.observers.push(

            observer

        );

    }


    detach(observer) {

        this.observers =

            this.observers.filter(

                o => o !== observer

            );

    }


    notify(segmentId) {

        this.observers.forEach(

            observer =>

            observer.updateStream(

                segmentId

            )

        );

    }


    setLiveState(segmentId) {

        this.activeSegmentId =

            segmentId;


        this.lastBroadcast =

            new Date();


        this.notify(

            segmentId

        );

    }

}

export default EventStreamSubject;