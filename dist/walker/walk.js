"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Walk_instances, _Walk_opts, _Walk_typeEnabled;
exports.__esModule = true;
exports.ancestorsOf = exports.byName = exports.typeOf = exports.Walk = exports.assertDirectory = exports.createPathError = exports.EntryType = void 0;
var node_path_1 = require("node:path");
var filetype_js_1 = require("../filetype.js");
var matchers_js_1 = require("../matchers.js");
// Every entry has one. FileType is the public subset; anything else, such as a
// socket or FIFO, is OTHER and never matched.
exports.EntryType = __assign(__assign({}, filetype_js_1.FileType), { OTHER: 'other' });
function createPathError(name, cause) {
    return new Error("'" + name + "' is not a valid path", { cause: cause });
}
exports.createPathError = createPathError;
// Search paths are where to search, so must be directories
function assertDirectory(name, stats) {
    if (!stats.isDirectory()) {
        throw new Error("'" + name + "' is not a directory");
    }
}
exports.assertDirectory = assertDirectory;
// State shared by a walk. The async and sync walks (async.ts and sync.ts) share
// everything except the calls that touch the file system, and both return
// matches in name order.
var Walk = /** @class */ (function () {
    function Walk(matcher, opts) {
        _Walk_instances.add(this);
        _Walk_opts.set(this, void 0);
        this.matcher = matcher;
        this.isSyncMatcher = (0, matchers_js_1.isSyncPredicate)(matcher);
        __classPrivateFieldSet(this, _Walk_opts, opts, "f");
    }
    Object.defineProperty(Walk.prototype, "ignoreSymlinks", {
        get: function () {
            return __classPrivateFieldGet(this, _Walk_opts, "f").ignoreSymlinks;
        },
        enumerable: false,
        configurable: true
    });
    Walk.prototype.isCandidate = function (file, type) {
        switch (type) {
            case exports.EntryType.DIRECTORY:
                return __classPrivateFieldGet(this, _Walk_instances, "m", _Walk_typeEnabled).call(this, type);
            case exports.EntryType.REGULAR:
                return __classPrivateFieldGet(this, _Walk_instances, "m", _Walk_typeEnabled).call(this, type) && !(__classPrivateFieldGet(this, _Walk_opts, "f").ignoreHiddenFiles && file.isHiddenSync());
            case exports.EntryType.OTHER:
                return false;
        }
    };
    // Hidden directories are neither returned nor walked
    Walk.prototype.shouldSkipDirectory = function (dir) {
        return __classPrivateFieldGet(this, _Walk_opts, "f").ignoreHiddenDirectories && dir.isHiddenSync();
    };
    // depth counts levels below the root, which is 0. A directory beyond
    // maxDepth is still returned, like any other entry at its level, but not walked.
    Walk.prototype.canDescend = function (depth) {
        return __classPrivateFieldGet(this, _Walk_opts, "f").maxDepth === undefined || depth <= __classPrivateFieldGet(this, _Walk_opts, "f").maxDepth;
    };
    return Walk;
}());
exports.Walk = Walk;
_Walk_opts = new WeakMap(), _Walk_instances = new WeakSet(), _Walk_typeEnabled = function _Walk_typeEnabled(type) {
    return __classPrivateFieldGet(this, _Walk_opts, "f").fileTypes.includes(type);
};
function typeOf(kind) {
    return kind.isDirectory() ? exports.EntryType.DIRECTORY : kind.isFile() ? exports.EntryType.REGULAR : exports.EntryType.OTHER;
}
exports.typeOf = typeOf;
function byName(a, b) {
    return a.getName() < b.getName() ? -1 : a.getName() > b.getName() ? 1 : 0;
}
exports.byName = byName;
function ancestorsOf(file) {
    var ancestors = [];
    var ancestor = (0, node_path_1.dirname)((0, node_path_1.resolve)(file.getName()));
    while ((0, node_path_1.dirname)(ancestor) !== ancestor) {
        ancestors.push(ancestor);
        ancestor = (0, node_path_1.dirname)(ancestor);
    }
    ancestors.push(ancestor);
    return ancestors;
}
exports.ancestorsOf = ancestorsOf;
