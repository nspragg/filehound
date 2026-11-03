"use strict";
exports.__esModule = true;
exports.from = void 0;
function from(args) {
    var first = args[0];
    return Array.isArray(first) ? first : args;
}
exports.from = from;
