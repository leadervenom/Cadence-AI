import EventUpdateManager from
"../src/realtime-operations/services/EventUpdateManager.js";

import Subscriber from
"../src/realtime-operations/models/Subscriber.js";

import EventUpdate from
"../src/realtime-operations/models/EventUpdate.js";


const manager = new EventUpdateManager();

const admin = new Subscriber(
    "USER001",
    "ADMIN"
);

manager.attachObserver(admin);

const update = new EventUpdate(
    "001",
    "Emergency on Stage A",
    "ACTIVE"
);

manager.notifyObserver(update);