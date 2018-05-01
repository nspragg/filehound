"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function copy(value) {
    return _.cloneDeep(value);
}
exports.copy = copy;
function from(args) {
    if (_.isArray(args[0])) {
        return args[0];
    }
    return Array.prototype.slice.call(args);
}
exports.from = from;
//# sourceMappingURL=arrays.js.map