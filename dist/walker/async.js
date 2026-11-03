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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var _AsyncWalk_instances, _AsyncWalk_signal, _AsyncWalk_reads, _AsyncWalk_found, _AsyncWalk_positions, _AsyncWalk_taken, _AsyncWalk_start, _AsyncWalk_find, _AsyncWalk_readAhead;
exports.__esModule = true;
exports.walkAsync = void 0;
var fsp = require("node:fs/promises");
var file_js_1 = require("../file.js");
var heap_js_1 = require("./heap.js");
var walk_js_1 = require("./walk.js");
// How the async walk works, and why
//
// The walk yields matches in batches, in the same order as the sync walk:
// depth first, with siblings in name order. Whoever reads the batches sets the
// pace, so the walk can't run ahead without limit, and stops when they stop.
//
// Walking in order on its own is slow, as each directory would wait on its
// read. So work is started ahead of the walk, within two limits:
//
// - WINDOW: within a directory, the siblings after the one being walked are
//   visited early, starting their stats, predicates and reads.
// - READ_AHEAD: across the tree, directories further on are read early.
//
// Directories are read ahead in the order the walk will reach them, using
// each one's Position and a heap. This order matters, and simpler orders were
// measured and found slow. Node queues reads, so a read the walk needs now
// waits behind every read started before it. Reading ahead among siblings only
// lost the concurrency of reading the tree at once (about 30% slower than
// reading it all, unbounded). Reading ahead in the order reads finished was
// worse: the walk's reads waited behind reads for far-off directories, and it
// was only fast once READ_AHEAD exceeded the number of directories in the tree.
// In walk order, a READ_AHEAD of 32 is enough to match unbounded reading.
//
// So before changing the order of reads, measure it with `npm run bench`, on
// trees both deep and wide.
//
// Work started ahead can fail, or be abandoned, before the walk reaches it.
// prefetch() stops those failures being reported as unhandled, and an aborted
// walk starts no new reads.
// How many siblings are visited ahead of the one being walked. Visiting starts
// the I/O an entry needs: a directory's read, a link's stat or a predicate's.
// Each level of the walk has its own window, so the work in flight is bounded
// by this times the depth.
var WINDOW = 64;
// How many more directories can be read ahead of the walk, beyond those in
// its windows, and not yet walked
var READ_AHEAD = 64;
// Work started ahead of the walk may fail before the walk reaches it, and
// later awaits still see the failure. Until then, Node would otherwise report
// it as unhandled.
function prefetch(pending) {
    pending["catch"](function () { });
    return pending;
}
// Compared index by index, positions give walk order: depth first, in name order
function precedes(a, b) {
    for (var i = 0; i < a.length && i < b.length; i++) {
        if (a[i] !== b[i]) {
            return a[i] < b[i];
        }
    }
    return a.length < b.length;
}
// Reading directories is most of the work of a walk, so they are read ahead
// of it, in the order the walk will reach them. Reads are queued, so one read
// out of order would hold up the walk behind the rest.
var AsyncWalk = /** @class */ (function (_super) {
    __extends(AsyncWalk, _super);
    function AsyncWalk(matcher, opts) {
        var _this = _super.call(this, matcher, opts) || this;
        _AsyncWalk_instances.add(_this);
        _AsyncWalk_signal.set(_this, void 0);
        // Read or being read, and not yet taken by the walk
        _AsyncWalk_reads.set(_this, new Map());
        // Found but not yet read
        _AsyncWalk_found.set(_this, new heap_js_1.Heap(function (a, b) { return precedes(a.position, b.position); }));
        // Of directories, and links that may be, for when the walk reads them
        _AsyncWalk_positions.set(_this, new WeakMap());
        _AsyncWalk_taken.set(_this, new WeakSet());
        __classPrivateFieldSet(_this, _AsyncWalk_signal, opts.signal, "f");
        return _this;
    }
    // Rejects as soon as the walk is aborted, rather than when the work is done,
    // which for a slow predicate could be a long wait
    AsyncWalk.prototype.abortable = function (pending) {
        var signal = __classPrivateFieldGet(this, _AsyncWalk_signal, "f");
        if (!signal) {
            return pending;
        }
        signal.throwIfAborted();
        return new Promise(function (resolve, reject) {
            var abort = function () { return reject(signal.reason); };
            signal.addEventListener('abort', abort, { once: true });
            pending.then(function (value) {
                signal.removeEventListener('abort', abort);
                resolve(value);
            }, function (error) {
                signal.removeEventListener('abort', abort);
                reject(error);
            });
        });
    };
    // For after a yield, as whoever reads the walk may have aborted it meanwhile
    AsyncWalk.prototype.throwIfAborted = function () {
        var _a;
        (_a = __classPrivateFieldGet(this, _AsyncWalk_signal, "f")) === null || _a === void 0 ? void 0 : _a.throwIfAborted();
    };
    // The directory's children in name order, read ahead if it was reached
    AsyncWalk.prototype.read = function (dir, depth) {
        var _a, _b;
        __classPrivateFieldGet(this, _AsyncWalk_taken, "f").add(dir);
        var read = (_a = __classPrivateFieldGet(this, _AsyncWalk_reads, "f").get(dir)) !== null && _a !== void 0 ? _a : __classPrivateFieldGet(this, _AsyncWalk_instances, "m", _AsyncWalk_start).call(this, { dir: dir, depth: depth, position: (_b = __classPrivateFieldGet(this, _AsyncWalk_positions, "f").get(dir)) !== null && _b !== void 0 ? _b : [] });
        __classPrivateFieldGet(this, _AsyncWalk_reads, "f")["delete"](dir);
        __classPrivateFieldGet(this, _AsyncWalk_instances, "m", _AsyncWalk_readAhead).call(this);
        return read;
    };
    return AsyncWalk;
}(walk_js_1.Walk));
_AsyncWalk_signal = new WeakMap(), _AsyncWalk_reads = new WeakMap(), _AsyncWalk_found = new WeakMap(), _AsyncWalk_positions = new WeakMap(), _AsyncWalk_taken = new WeakMap(), _AsyncWalk_instances = new WeakSet(), _AsyncWalk_start = function _AsyncWalk_start(_a) {
    var _this = this;
    var dir = _a.dir, depth = _a.depth, position = _a.position;
    return prefetch((0, file_js_1.getChildren)(dir).then(function (children) {
        children.sort(walk_js_1.byName);
        __classPrivateFieldGet(_this, _AsyncWalk_instances, "m", _AsyncWalk_find).call(_this, children, depth + 1, position);
        return children;
    }));
}, _AsyncWalk_find = function _AsyncWalk_find(children, depth, parent) {
    var _this = this;
    if (!this.canDescend(depth)) {
        return;
    }
    children.forEach(function (child, i) {
        var kind = (0, file_js_1.getKnownKind)(child);
        if (kind && !kind.isDirectory()) {
            return;
        }
        var position = __spreadArray(__spreadArray([], parent, true), [i], false);
        __classPrivateFieldGet(_this, _AsyncWalk_positions, "f").set(child, position);
        if (kind && !_this.shouldSkipDirectory(child)) {
            __classPrivateFieldGet(_this, _AsyncWalk_found, "f").push({ dir: child, depth: depth, position: position });
        }
    });
    __classPrivateFieldGet(this, _AsyncWalk_instances, "m", _AsyncWalk_readAhead).call(this);
}, _AsyncWalk_readAhead = function _AsyncWalk_readAhead() {
    var _a;
    if ((_a = __classPrivateFieldGet(this, _AsyncWalk_signal, "f")) === null || _a === void 0 ? void 0 : _a.aborted) {
        return;
    }
    while (__classPrivateFieldGet(this, _AsyncWalk_reads, "f").size < READ_AHEAD && __classPrivateFieldGet(this, _AsyncWalk_found, "f").size > 0) {
        var found = __classPrivateFieldGet(this, _AsyncWalk_found, "f").pop();
        if (!__classPrivateFieldGet(this, _AsyncWalk_taken, "f").has(found.dir)) {
            __classPrivateFieldGet(this, _AsyncWalk_reads, "f").set(found.dir, __classPrivateFieldGet(this, _AsyncWalk_instances, "m", _AsyncWalk_start).call(this, found));
        }
    }
};
// A linked directory that resolves to one of its own ancestors would be walked forever
function isCyclicLink(link) {
    return __awaiter(this, void 0, void 0, function () {
        var target, _i, _a, ancestor;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fsp.realpath(link.getName())];
                case 1:
                    target = _b.sent();
                    _i = 0, _a = (0, walk_js_1.ancestorsOf)(link);
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    ancestor = _a[_i];
                    return [4 /*yield*/, fsp.realpath(ancestor)];
                case 3:
                    if ((_b.sent()) === target) {
                        return [2 /*return*/, true];
                    }
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, false];
            }
        });
    });
}
// Broken links are skipped, as are all links when ignoreSymlinks is set
function isVisitableLink(link, walk) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (walk.ignoreSymlinks) {
                        return [2 /*return*/, false];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, link.isDirectory()];
                case 2:
                    _a = (_c.sent());
                    if (!_a) return [3 /*break*/, 4];
                    return [4 /*yield*/, isCyclicLink(link)];
                case 3:
                    _a = (_c.sent());
                    _c.label = 4;
                case 4: return [2 /*return*/, !(_a)];
                case 5:
                    _b = _c.sent();
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var NOTHING = Object.freeze({});
// Links have no known kind, so need a stat
function visitUntyped(file, walk, depth) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = visitTyped;
                    _b = [file];
                    _c = walk_js_1.typeOf;
                    return [4 /*yield*/, file.getStats()];
                case 1: return [2 /*return*/, _a.apply(void 0, _b.concat([_c.apply(void 0, [_d.sent()]), walk, depth]))];
            }
        });
    });
}
function visitLink(link, walk, depth) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, isVisitableLink(link, walk)];
                case 1: return [2 /*return*/, (_a.sent()) ? visitUntyped(link, walk, depth) : NOTHING];
            }
        });
    });
}
function visitTyped(file, type, walk, depth) {
    if (type === walk_js_1.EntryType.DIRECTORY && walk.shouldSkipDirectory(file)) {
        return NOTHING;
    }
    var children = type === walk_js_1.EntryType.DIRECTORY && walk.canDescend(depth) ? walk.read(file, depth) : undefined;
    if (!walk.isCandidate(file, type)) {
        return children ? { children: children } : NOTHING;
    }
    if (walk.isSyncMatcher) {
        return walk.matcher.testSync(file) ? { match: file, children: children } : children ? { children: children } : NOTHING;
    }
    return walk.matcher.test(file).then(function (isMatch) { return ({ match: isMatch ? file : undefined, children: children }); });
}
// Children always have a dirent, so only links lack a known kind
function visitChild(child, walk, depth) {
    var kind = (0, file_js_1.getKnownKind)(child);
    var visited = kind ? visitTyped(child, (0, walk_js_1.typeOf)(kind), walk, depth) : visitLink(child, walk, depth);
    return visited instanceof Promise ? prefetch(visited) : visited;
}
// Matches are yielded in batches, in walk order: an entry, then everything
// below it, then its next sibling, with siblings in name order. A batch is
// yielded before walking down, so matches arrive as they are found.
function walkChildren(children, walk, depth) {
    return __asyncGenerator(this, arguments, function walkChildren_1() {
        var visits, started, matches, next, end, visited, visit, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    visits = [];
                    started = 0;
                    matches = [];
                    next = 0;
                    _c.label = 1;
                case 1:
                    if (!(next < children.length)) return [3 /*break*/, 12];
                    for (end = Math.min(next + WINDOW, children.length); started < end; started++) {
                        visits[started] = visitChild(children[started], walk, depth);
                    }
                    visited = visits[next];
                    visits[next] = undefined;
                    if (!(visited instanceof Promise)) return [3 /*break*/, 3];
                    return [4 /*yield*/, __await(walk.abortable(visited))];
                case 2:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = visited;
                    _c.label = 4;
                case 4:
                    visit = _a;
                    if (visit.match) {
                        matches.push(visit.match);
                    }
                    if (!visit.children) return [3 /*break*/, 11];
                    if (!(matches.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, __await(matches)];
                case 5: return [4 /*yield*/, _c.sent()];
                case 6:
                    _c.sent();
                    walk.throwIfAborted();
                    matches = [];
                    _c.label = 7;
                case 7:
                    _b = walkChildren;
                    return [4 /*yield*/, __await(walk.abortable(visit.children))];
                case 8: return [5 /*yield**/, __values(__asyncDelegator.apply(void 0, [__asyncValues.apply(void 0, [_b.apply(void 0, [_c.sent(), walk, depth + 1])])]))];
                case 9: return [4 /*yield*/, __await.apply(void 0, [_c.sent()])];
                case 10:
                    _c.sent();
                    _c.label = 11;
                case 11:
                    next++;
                    return [3 /*break*/, 1];
                case 12:
                    if (!(matches.length > 0)) return [3 /*break*/, 15];
                    return [4 /*yield*/, __await(matches)];
                case 13: return [4 /*yield*/, _c.sent()];
                case 14:
                    _c.sent();
                    walk.throwIfAborted();
                    _c.label = 15;
                case 15: return [2 /*return*/];
            }
        });
    });
}
function walkAsync(dir, matcher, opts) {
    var _a;
    return __asyncGenerator(this, arguments, function walkAsync_1() {
        var root, stats, error_1, walk, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    (_a = opts.signal) === null || _a === void 0 ? void 0 : _a.throwIfAborted();
                    root = new file_js_1.File(dir);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, __await(root.getStats())];
                case 2:
                    stats = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    throw (0, walk_js_1.createPathError)(dir, error_1);
                case 4:
                    (0, walk_js_1.assertDirectory)(dir, stats);
                    walk = new AsyncWalk(matcher, opts);
                    _b = walkChildren;
                    return [4 /*yield*/, __await(walk.abortable(walk.read(root, 0)))];
                case 5: return [5 /*yield**/, __values(__asyncDelegator.apply(void 0, [__asyncValues.apply(void 0, [_b.apply(void 0, [_c.sent(), walk, 1])])]))];
                case 6: return [4 /*yield*/, __await.apply(void 0, [_c.sent()])];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.walkAsync = walkAsync;
