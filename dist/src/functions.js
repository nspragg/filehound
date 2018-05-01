"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function negate(fn) {
    return function (args) {
        return !fn(args);
    };
}
exports.negate = negate;
function compose(args) {
    const functions = _.isFunction(args) ? Array.from(arguments) : args;
    return (file) => {
        let match = true;
        /* tslint:disable:no-increment-decrement */
        for (let i = 0; i < functions.length; i++) {
            match = match && functions[i](file);
        }
        return match;
    };
}
exports.compose = compose;
//# sourceMappingURL=functions.js.map