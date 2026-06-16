import Conflict from "../src/running-order/models/Conflict.js";

import HighSeverity from "../src/running-order/strategies/HighSeverity.js";

import LowSeverity from "../src/running-order/strategies/LowSeverity.js";


const highConflict = new Conflict(
    1,
    "VIP schedule conflict",
    "HIGH"
);

const lowConflict = new Conflict(
    2,
    "Minor timing overlap",
    "LOW"
);


const highStrategy = new HighSeverity();

const lowStrategy = new LowSeverity();


highStrategy.resolveConflict(
    highConflict
);

console.log("----------");

lowStrategy.resolveConflict(
    lowConflict
);

import ExportTemplate from "../src/running-order/models/ExportTemplate.js";
import ExportFileAdapter from "../src/running-order/adapters/ExportFileAdapter.js";

const template = new ExportTemplate(
    1,
    "PDF Template",
    "Export as PDF"
);

const adapter = new ExportFileAdapter(
    "FILE001",
    "running-order.pdf",
    "PDF",
    template
);

console.log(adapter.export());