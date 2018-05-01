"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const bind_1 = require("./bind");
// TODO: re-create matcher - retaining state i.e filters?
class Matcher {
    constructor() {
        this.filters = [];
        this.negate = false;
        bind_1.default(this);
    }
    on(filter) {
        this.filters.push(filter);
        return this;
    }
    static negate(fn) {
        return function (args) {
            return !fn(args);
        };
    }
    static isMatch(pattern) {
        return (file) => {
            return new RegExp(pattern).test(file.getName());
        };
    }
    negateAll() {
        this.negate = true;
        return this;
    }
    static compose(args) {
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
    create() {
        const isMatch = Matcher.compose(this.filters);
        if (this.negate) {
            return Matcher.negate(isMatch);
        }
        return isMatch;
    }
}
exports.Matcher = Matcher;
exports.default = Matcher;
//# sourceMappingURL=matcher.js.map