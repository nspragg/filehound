"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _FileHound_instances, _FileHound_searchPaths, _FileHound_maxDepth, _FileHound_types, _FileHound_matchExpression, _FileHound_ignoreHiddenFiles, _FileHound_ignoreHiddenDirectories, _FileHound_ignoreSymlinks, _FileHound_includeFileStats, _FileHound_queryLocked, _FileHound_throwIfQueryLocked, _FileHound_validateTypeArguments, _FileHound_getMatchExpression, _FileHound_toResult, _FileHound_toResultSync, _FileHound_searchSync, _FileHound_iterate, _FileHound_getNextBatch, _FileHound_getOptions;
exports.__esModule = true;
exports.FileHound = void 0;
var path = require("node:path");
var node_events_1 = require("node:events");
var arrays_js_1 = require("./arrays.js");
var files_js_1 = require("./files.js");
var matchers_js_1 = require("./matchers.js");
var filetype_js_1 = require("./filetype.js");
var async_js_1 = require("./walker/async.js");
var sync_js_1 = require("./walker/sync.js");
var fileTypes = Object.values(filetype_js_1.FileType);
/**
 * A fluent query for searching the file system.
 *
 * @typeParam T - the type of each match: a path, or a {@link FileWithStats}
 * when {@link FileHound.includeFileStats} is set
 *
 * @remarks
 * Configure a query by chaining methods, then run it with {@link FileHound.find}
 * or {@link FileHound.findSync}. Once a search has started the query is locked
 * and can no longer be modified.
 *
 * @example
 * ```ts
 * import { FileHound, ext } from 'filehound';
 *
 * const files = await FileHound.create()
 *   .paths('/tmp')
 *   .match(ext('json'))
 *   .depth(1)
 *   .find();
 * ```
 */
var FileHound = /** @class */ (function (_super) {
    __extends(FileHound, _super);
    function FileHound() {
        var _this = _super.call(this) || this;
        _FileHound_instances.add(_this);
        _FileHound_searchPaths.set(_this, void 0);
        _FileHound_maxDepth.set(_this, void 0);
        _FileHound_types.set(_this, void 0);
        _FileHound_matchExpression.set(_this, void 0);
        _FileHound_ignoreHiddenFiles.set(_this, false);
        _FileHound_ignoreHiddenDirectories.set(_this, false);
        _FileHound_ignoreSymlinks.set(_this, false);
        _FileHound_includeFileStats.set(_this, false);
        _FileHound_queryLocked.set(_this, false);
        __classPrivateFieldSet(_this, _FileHound_searchPaths, [process.cwd()], "f");
        __classPrivateFieldSet(_this, _FileHound_types, [filetype_js_1.FileType.REGULAR], "f");
        return _this;
    }
    /**
     * Static factory method to create an instance of FileHound
     *
     * @returns a new FileHound instance
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const filehound = FileHound.create();
     * ```
     */
    FileHound.create = function () {
        return new FileHound();
    };
    /**
     * Executes one or more FileHound queries and combines their results
     *
     * @param args - the FileHound instances to execute
     * @returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all files matched by any of the queries
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.any(fh1, fh2);
     * ```
     */
    FileHound.any = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var pending, files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pending = args.map(function (fh) { return fh.find(); });
                        return [4 /*yield*/, Promise.all(pending)];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files.flat()];
                }
            });
        });
    };
    FileHound.prototype.paths = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        __classPrivateFieldSet(this, _FileHound_searchPaths, __spreadArray([], new Set((0, arrays_js_1.from)(args)), true).map(path.normalize), "f");
        return this;
    };
    /**
     * Specifies the criteria that files must satisfy to be included in the
     * results. Defaults to matching all files.
     *
     * @param query - the predicate used to test each file
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @throws `TypeError`
     * Thrown if the query is not a valid matcher.
     * @example
     * ```ts
     * import { FileHound, ext } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .match(ext('json'))
     *   .find();
     * ```
     */
    FileHound.prototype.match = function (query) {
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        if (query === null || query === undefined || typeof query !== 'object' || typeof query.test !== 'function' || typeof query.testSync !== 'function') {
            throw new TypeError('Match expression must be a valid matcher');
        }
        __classPrivateFieldSet(this, _FileHound_matchExpression, query, "f");
        return this;
    };
    /**
     * Specify the directory search depth. If set to zero, recursive searching
     * will be disabled. Directories at the limit are not searched, but are
     * still returned when {@link FileHound.type} includes directories.
     *
     * @param depth - the maximum search depth (a non-negative integer)
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @throws `RangeError`
     * Thrown if depth is negative or not an integer.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .depth(0)
     *   .find(); // array of file names only in the current directory
     * ```
     */
    FileHound.prototype.depth = function (depth) {
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        if (depth < 0 || !Number.isSafeInteger(depth)) {
            throw new RangeError('Depth must be a positive integer');
        }
        __classPrivateFieldSet(this, _FileHound_maxDepth, depth, "f");
        return this;
    };
    /**
     * Specifies the types of file system entry to return. Defaults to
     * regular files only.
     *
     * @param types - one or more file types
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @throws `RangeError`
     * Thrown if no file types are given.
     * @throws `TypeError`
     * Thrown if an invalid file type is given.
     * @example
     * ```ts
     * import { FileHound, FileType } from 'filehound';
     *
     * const directories = await FileHound.create()
     *   .type(FileType.DIRECTORY)
     *   .find();
     * ```
     */
    FileHound.prototype.type = function () {
        var types = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            types[_i] = arguments[_i];
        }
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_validateTypeArguments).call(this, types);
        __classPrivateFieldSet(this, _FileHound_types, types, "f");
        return this;
    };
    /**
     * Excludes hidden files (names beginning with a dot) from the results
     *
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .ignoreHiddenFiles()
     *   .find();
     * ```
     */
    FileHound.prototype.ignoreHiddenFiles = function () {
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        __classPrivateFieldSet(this, _FileHound_ignoreHiddenFiles, true, "f");
        return this;
    };
    /**
     * Excludes hidden directories (names beginning with a dot), and their
     * contents, from the search
     *
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .ignoreHiddenDirectories()
     *   .find();
     * ```
     */
    FileHound.prototype.ignoreHiddenDirectories = function () {
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        __classPrivateFieldSet(this, _FileHound_ignoreHiddenDirectories, true, "f");
        return this;
    };
    /**
     * Excludes symbolic links from the search. Linked files are not matched
     * and linked directories are not searched.
     *
     * @remarks
     * By default, symbolic links are followed: a linked file is matched as its
     * target and a linked directory is searched. Broken links, and links back to
     * a directory already being searched, are always skipped.
     *
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .ignoreSymlinks()
     *   .find();
     * ```
     */
    FileHound.prototype.ignoreSymlinks = function () {
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        __classPrivateFieldSet(this, _FileHound_ignoreSymlinks, true, "f");
        return this;
    };
    /**
     * Returns each match with its stats, as `{ path, stats }`, in place of
     * its path. Stats already fetched by a predicate are reused.
     *
     * @returns the FileHound instance, typed to return {@link FileWithStats} matches
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .includeFileStats()
     *   .find();
     *
     * files.forEach(({ path, stats }) => console.log(path, stats.size));
     * ```
     */
    FileHound.prototype.includeFileStats = function () {
        __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_throwIfQueryLocked).call(this);
        __classPrivateFieldSet(this, _FileHound_includeFileStats, true, "f");
        return this;
    };
    /**
     * Asynchronously executes a file search. Once called, the query is
     * locked and can no longer be modified.
     *
     * @param options - a signal to stop the search
     * @returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files
     *
     * @remarks
     * Emits a `match` event for each matching file, an `error` event if the
     * search fails or is aborted and an `end` event when the search completes.
     *
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const filehound = FileHound.create();
     * const files = await filehound.find();
     *
     * console.log(files);
     * ```
     * @example
     * Giving up on a search after five seconds:
     * ```ts
     * const files = await FileHound.create()
     *   .paths('/')
     *   .find({ signal: AbortSignal.timeout(5000) });
     * ```
     */
    FileHound.prototype.find = function (options) {
        var e_1, _a;
        var _b;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var found, _c, _d, results, _i, results_1, result, e_1_1, error_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        __classPrivateFieldSet(this, _FileHound_queryLocked, true, "f");
                        found = [];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 14, 15, 16]);
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 7, 8, 13]);
                        _c = __asyncValues(__classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_getNextBatch).call(this, options.signal));
                        _e.label = 3;
                    case 3: return [4 /*yield*/, _c.next()];
                    case 4:
                        if (!(_d = _e.sent(), !_d.done)) return [3 /*break*/, 6];
                        results = _d.value;
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            found.push(result);
                            this.emit('match', result);
                            (_b = options.signal) === null || _b === void 0 ? void 0 : _b.throwIfAborted();
                        }
                        _e.label = 5;
                    case 5: return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _e.trys.push([8, , 11, 12]);
                        if (!(_d && !_d.done && (_a = _c["return"]))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(_c)];
                    case 9:
                        _e.sent();
                        _e.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13: return [2 /*return*/, found];
                    case 14:
                        error_1 = _e.sent();
                        this.emit('error', error_1);
                        throw error_1;
                    case 15:
                        this.emit('end');
                        return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Asynchronously executes a file search, returning matches one at a time
     * as they are found, in the same order as {@link FileHound.find}. Once
     * called, the query is locked and can no longer be modified.
     *
     * @remarks
     * The search runs ahead of the loop by a bounded amount, so a large search
     * can be read without holding every match in memory. Breaking out of the
     * loop stops the search.
     *
     * Emits a `match` event as each match is returned, an `error` event if the
     * search fails or is aborted and an `end` event when the search finishes:
     * when every match has been returned, the search fails or is aborted, or
     * the loop is left early.
     *
     * @param options - a signal to stop the search
     * @returns an async iterator of matches
     * @example
     * ```ts
     * import { FileHound, ext } from 'filehound';
     *
     * const query = FileHound.create()
     *   .paths('/tmp')
     *   .match(ext('json'));
     *
     * for await (const file of query.iterate()) {
     *   console.log(file);
     * }
     * ```
     */
    FileHound.prototype.iterate = function (options) {
        if (options === void 0) { options = {}; }
        __classPrivateFieldSet(this, _FileHound_queryLocked, true, "f");
        return __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_iterate).call(this, options.signal);
    };
    /**
     * Synchronously executes a file search. Once called, the query is
     * locked and can no longer be modified. No events are emitted.
     *
     * @returns an array of all matching files
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const filehound = FileHound.create();
     * const files = filehound.findSync();
     * console.log(files);
     * ```
     */
    FileHound.prototype.findSync = function () {
        var _this = this;
        __classPrivateFieldSet(this, _FileHound_queryLocked, true, "f");
        return this.getPaths()
            .flatMap(function (dir) { return __classPrivateFieldGet(_this, _FileHound_instances, "m", _FileHound_searchSync).call(_this, dir); })
            .map(function (file) { return __classPrivateFieldGet(_this, _FileHound_instances, "m", _FileHound_toResultSync).call(_this, file); });
    };
    /**
     * Returns the paths that will be searched. When no depth is set, any path
     * that is a subdirectory of another search path is removed, as it would
     * otherwise be searched twice.
     *
     * @returns a copy of the search paths
     */
    FileHound.prototype.getPaths = function () {
        var paths = __classPrivateFieldGet(this, _FileHound_maxDepth, "f") !== undefined
            ? __classPrivateFieldGet(this, _FileHound_searchPaths, "f")
            : (0, files_js_1.reducePaths)(__classPrivateFieldGet(this, _FileHound_searchPaths, "f"));
        return __spreadArray([], paths, true);
    };
    return FileHound;
}(node_events_1.EventEmitter));
exports.FileHound = FileHound;
_FileHound_searchPaths = new WeakMap(), _FileHound_maxDepth = new WeakMap(), _FileHound_types = new WeakMap(), _FileHound_matchExpression = new WeakMap(), _FileHound_ignoreHiddenFiles = new WeakMap(), _FileHound_ignoreHiddenDirectories = new WeakMap(), _FileHound_ignoreSymlinks = new WeakMap(), _FileHound_includeFileStats = new WeakMap(), _FileHound_queryLocked = new WeakMap(), _FileHound_instances = new WeakSet(), _FileHound_throwIfQueryLocked = function _FileHound_throwIfQueryLocked() {
    if (__classPrivateFieldGet(this, _FileHound_queryLocked, "f")) {
        throw new Error('Cannot modify query after search has started');
    }
}, _FileHound_validateTypeArguments = function _FileHound_validateTypeArguments(types) {
    if (types.length === 0) {
        throw new RangeError('At least one file type must be specified');
    }
    types.forEach(function (type) {
        if (!fileTypes.includes(type)) {
            throw new TypeError("Invalid file type: " + type + ".");
        }
    });
}, _FileHound_getMatchExpression = function _FileHound_getMatchExpression() {
    var _a;
    return (_a = __classPrivateFieldGet(this, _FileHound_matchExpression, "f")) !== null && _a !== void 0 ? _a : (0, matchers_js_1.matchAll)();
}, _FileHound_toResult = function _FileHound_toResult(file) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!__classPrivateFieldGet(this, _FileHound_includeFileStats, "f")) return [3 /*break*/, 2];
                    _a = { path: file.getName() };
                    return [4 /*yield*/, file.getStats()];
                case 1: return [2 /*return*/, (_a.stats = _b.sent(), _a)];
                case 2: return [2 /*return*/, file.getName()];
            }
        });
    });
}, _FileHound_toResultSync = function _FileHound_toResultSync(file) {
    if (__classPrivateFieldGet(this, _FileHound_includeFileStats, "f")) {
        return { path: file.getName(), stats: file.getStatsSync() };
    }
    return file.getName();
}, _FileHound_searchSync = function _FileHound_searchSync(dir) {
    return (0, sync_js_1.walkSync)(dir, __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_getMatchExpression).call(this), __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_getOptions).call(this));
}, _FileHound_iterate = function _FileHound_iterate(signal) {
    return __asyncGenerator(this, arguments, function _FileHound_iterate_1() {
        var _a, _b, results, _i, results_2, result, e_2_1, error_2;
        var e_2, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 17, 18, 19]);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 10, 11, 16]);
                    _a = __asyncValues(__classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_getNextBatch).call(this, signal));
                    _d.label = 2;
                case 2: return [4 /*yield*/, __await(_a.next())];
                case 3:
                    if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 9];
                    results = _b.value;
                    _i = 0, results_2 = results;
                    _d.label = 4;
                case 4:
                    if (!(_i < results_2.length)) return [3 /*break*/, 8];
                    result = results_2[_i];
                    this.emit('match', result);
                    return [4 /*yield*/, __await(result)];
                case 5: return [4 /*yield*/, _d.sent()];
                case 6:
                    _d.sent();
                    signal === null || signal === void 0 ? void 0 : signal.throwIfAborted();
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 4];
                case 8: return [3 /*break*/, 2];
                case 9: return [3 /*break*/, 16];
                case 10:
                    e_2_1 = _d.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 16];
                case 11:
                    _d.trys.push([11, , 14, 15]);
                    if (!(_b && !_b.done && (_c = _a["return"]))) return [3 /*break*/, 13];
                    return [4 /*yield*/, __await(_c.call(_a))];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13: return [3 /*break*/, 15];
                case 14:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 15: return [7 /*endfinally*/];
                case 16: return [3 /*break*/, 19];
                case 17:
                    error_2 = _d.sent();
                    this.emit('error', error_2);
                    throw error_2;
                case 18:
                    this.emit('end');
                    return [7 /*endfinally*/];
                case 19: return [2 /*return*/];
            }
        });
    });
}, _FileHound_getNextBatch = function _FileHound_getNextBatch(signal) {
    return __asyncGenerator(this, arguments, function _FileHound_getNextBatch_1() {
        var _i, _a, dir, _b, _c, files, _d, e_3_1;
        var _this = this;
        var e_3, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _i = 0, _a = this.getPaths();
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 19];
                    dir = _a[_i];
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 12, 13, 18]);
                    _b = (e_3 = void 0, __asyncValues((0, async_js_1.walkAsync)(dir, __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_getMatchExpression).call(this), __classPrivateFieldGet(this, _FileHound_instances, "m", _FileHound_getOptions).call(this, signal))));
                    _f.label = 3;
                case 3: return [4 /*yield*/, __await(_b.next())];
                case 4:
                    if (!(_c = _f.sent(), !_c.done)) return [3 /*break*/, 11];
                    files = _c.value;
                    if (!__classPrivateFieldGet(this, _FileHound_includeFileStats, "f")) return [3 /*break*/, 6];
                    return [4 /*yield*/, __await(Promise.all(files.map(function (file) { return __classPrivateFieldGet(_this, _FileHound_instances, "m", _FileHound_toResult).call(_this, file); })))];
                case 5:
                    _d = _f.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _d = files.map(function (file) { return file.getName(); });
                    _f.label = 7;
                case 7: return [4 /*yield*/, __await.apply(void 0, [_d])];
                case 8: return [4 /*yield*/, _f.sent()];
                case 9:
                    _f.sent();
                    _f.label = 10;
                case 10: return [3 /*break*/, 3];
                case 11: return [3 /*break*/, 18];
                case 12:
                    e_3_1 = _f.sent();
                    e_3 = { error: e_3_1 };
                    return [3 /*break*/, 18];
                case 13:
                    _f.trys.push([13, , 16, 17]);
                    if (!(_c && !_c.done && (_e = _b["return"]))) return [3 /*break*/, 15];
                    return [4 /*yield*/, __await(_e.call(_b))];
                case 14:
                    _f.sent();
                    _f.label = 15;
                case 15: return [3 /*break*/, 17];
                case 16:
                    if (e_3) throw e_3.error;
                    return [7 /*endfinally*/];
                case 17: return [7 /*endfinally*/];
                case 18:
                    _i++;
                    return [3 /*break*/, 1];
                case 19: return [2 /*return*/];
            }
        });
    });
}, _FileHound_getOptions = function _FileHound_getOptions(signal) {
    return {
        ignoreHiddenDirectories: __classPrivateFieldGet(this, _FileHound_ignoreHiddenDirectories, "f"),
        ignoreHiddenFiles: __classPrivateFieldGet(this, _FileHound_ignoreHiddenFiles, "f"),
        ignoreSymlinks: __classPrivateFieldGet(this, _FileHound_ignoreSymlinks, "f"),
        maxDepth: __classPrivateFieldGet(this, _FileHound_maxDepth, "f"),
        fileTypes: __classPrivateFieldGet(this, _FileHound_types, "f"),
        signal: signal
    };
};
