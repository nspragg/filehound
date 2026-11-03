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
var _And_left, _And_right, _Not_filePredicate, _Or_left, _Or_right, _Extension_extensions, _a, _Glob_globPattern, _b, _TextMatch_pattern, _TextMatch_flags, _c, _CustomFilter_fn, _CustomFilterSync_fn, _d, _Size_isMatch, _Modified_isMatch, _Accessed_isMatch, _Changed_isMatch, _e;
exports.__esModule = true;
exports.not = exports.changed = exports.accessed = exports.modified = exports.discard = exports.like = exports.applyFilterSync = exports.applyFilter = exports.glob = exports.isEmpty = exports.sizeEquals = exports.size = exports.matchAll = exports.ext = exports.MatchAll = exports.Changed = exports.Accessed = exports.Modified = exports.Size = exports.CustomFilterSync = exports.CustomFilter = exports.TextMatch = exports.Glob = exports.Extension = exports.Or = exports.Not = exports.And = exports.AbstractFilePredicate = exports.isSyncPredicate = void 0;
var unit_compare_1 = require("unit-compare");
var arrays_js_1 = require("./arrays.js");
// Brands predicates that test a file without I/O, so find() can call testSync
// and save a promise per file. The symbol is not exported from the package, so
// any other predicate is assumed to need I/O and is tested with test().
var sync = Symbol('SyncFilePredicate');
function isSyncPredicate(predicate) {
    return predicate[sync] === true;
}
exports.isSyncPredicate = isSyncPredicate;
// Predicates that need no I/O only implement testSync
var AbstractFilePredicate = /** @class */ (function () {
    function AbstractFilePredicate() {
    }
    AbstractFilePredicate.prototype.or = function (f) {
        return new Or(this, f);
    };
    AbstractFilePredicate.prototype.and = function (f) {
        return new And(this, f);
    };
    AbstractFilePredicate.prototype.not = function () {
        return new Not(this);
    };
    AbstractFilePredicate.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_f) {
                return [2 /*return*/, this.testSync(file)];
            });
        });
    };
    return AbstractFilePredicate;
}());
exports.AbstractFilePredicate = AbstractFilePredicate;
var And = /** @class */ (function (_super) {
    __extends(And, _super);
    function And(left, right) {
        var _this = _super.call(this) || this;
        _And_left.set(_this, void 0);
        _And_right.set(_this, void 0);
        __classPrivateFieldSet(_this, _And_left, left, "f");
        __classPrivateFieldSet(_this, _And_right, right, "f");
        return _this;
    }
    Object.defineProperty(And.prototype, (_And_left = new WeakMap(), _And_right = new WeakMap(), sync), {
        get: function () {
            return isSyncPredicate(__classPrivateFieldGet(this, _And_left, "f")) && isSyncPredicate(__classPrivateFieldGet(this, _And_right, "f"));
        },
        enumerable: false,
        configurable: true
    });
    And.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _And_left, "f").test(file)];
                    case 1: return [2 /*return*/, (_f.sent()) && __classPrivateFieldGet(this, _And_right, "f").test(file)];
                }
            });
        });
    };
    And.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _And_left, "f").testSync(file) && __classPrivateFieldGet(this, _And_right, "f").testSync(file);
    };
    return And;
}(AbstractFilePredicate));
exports.And = And;
var Not = /** @class */ (function (_super) {
    __extends(Not, _super);
    function Not(filePredicate) {
        var _this = _super.call(this) || this;
        _Not_filePredicate.set(_this, void 0);
        __classPrivateFieldSet(_this, _Not_filePredicate, filePredicate, "f");
        return _this;
    }
    Object.defineProperty(Not.prototype, (_Not_filePredicate = new WeakMap(), sync), {
        get: function () {
            return isSyncPredicate(__classPrivateFieldGet(this, _Not_filePredicate, "f"));
        },
        enumerable: false,
        configurable: true
    });
    Not.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _Not_filePredicate, "f").test(file)];
                    case 1: return [2 /*return*/, !(_f.sent())];
                }
            });
        });
    };
    Not.prototype.testSync = function (file) {
        return !__classPrivateFieldGet(this, _Not_filePredicate, "f").testSync(file);
    };
    return Not;
}(AbstractFilePredicate));
exports.Not = Not;
var Or = /** @class */ (function (_super) {
    __extends(Or, _super);
    function Or(left, right) {
        var _this = _super.call(this) || this;
        _Or_left.set(_this, void 0);
        _Or_right.set(_this, void 0);
        __classPrivateFieldSet(_this, _Or_left, left, "f");
        __classPrivateFieldSet(_this, _Or_right, right, "f");
        return _this;
    }
    Object.defineProperty(Or.prototype, (_Or_left = new WeakMap(), _Or_right = new WeakMap(), sync), {
        get: function () {
            return isSyncPredicate(__classPrivateFieldGet(this, _Or_left, "f")) && isSyncPredicate(__classPrivateFieldGet(this, _Or_right, "f"));
        },
        enumerable: false,
        configurable: true
    });
    Or.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _Or_left, "f").test(file)];
                    case 1: return [2 /*return*/, (_f.sent()) || __classPrivateFieldGet(this, _Or_right, "f").test(file)];
                }
            });
        });
    };
    Or.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _Or_left, "f").testSync(file) || __classPrivateFieldGet(this, _Or_right, "f").testSync(file);
    };
    return Or;
}(AbstractFilePredicate));
exports.Or = Or;
var Extension = /** @class */ (function (_super) {
    __extends(Extension, _super);
    function Extension(extensions) {
        var _this = _super.call(this) || this;
        _this[_a] = true;
        _Extension_extensions.set(_this, void 0);
        __classPrivateFieldSet(_this, _Extension_extensions, extensions, "f");
        return _this;
    }
    Extension.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _Extension_extensions, "f").includes(file.getPathExtension());
    };
    return Extension;
}(AbstractFilePredicate));
exports.Extension = Extension;
_Extension_extensions = new WeakMap(), _a = sync;
var Glob = /** @class */ (function (_super) {
    __extends(Glob, _super);
    function Glob(globPattern) {
        var _this = _super.call(this) || this;
        _this[_b] = true;
        _Glob_globPattern.set(_this, void 0);
        __classPrivateFieldSet(_this, _Glob_globPattern, globPattern, "f");
        return _this;
    }
    Glob.prototype.testSync = function (file) {
        return file.isMatch(__classPrivateFieldGet(this, _Glob_globPattern, "f"));
    };
    return Glob;
}(AbstractFilePredicate));
exports.Glob = Glob;
_Glob_globPattern = new WeakMap(), _b = sync;
var TextMatch = /** @class */ (function (_super) {
    __extends(TextMatch, _super);
    function TextMatch(pattern, flags) {
        var _this = _super.call(this) || this;
        _this[_c] = true;
        _TextMatch_pattern.set(_this, void 0);
        _TextMatch_flags.set(_this, void 0);
        __classPrivateFieldSet(_this, _TextMatch_pattern, pattern, "f");
        __classPrivateFieldSet(_this, _TextMatch_flags, flags, "f");
        return _this;
    }
    TextMatch.prototype.testSync = function (file) {
        return new RegExp(__classPrivateFieldGet(this, _TextMatch_pattern, "f"), __classPrivateFieldGet(this, _TextMatch_flags, "f")).test(file.getName());
    };
    return TextMatch;
}(AbstractFilePredicate));
exports.TextMatch = TextMatch;
_TextMatch_pattern = new WeakMap(), _TextMatch_flags = new WeakMap(), _c = sync;
var CustomFilter = /** @class */ (function (_super) {
    __extends(CustomFilter, _super);
    function CustomFilter(fn) {
        var _this = _super.call(this) || this;
        _CustomFilter_fn.set(_this, void 0);
        __classPrivateFieldSet(_this, _CustomFilter_fn, fn, "f");
        return _this;
    }
    CustomFilter.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_f) {
                return [2 /*return*/, __classPrivateFieldGet(this, _CustomFilter_fn, "f").call(this, file)];
            });
        });
    };
    CustomFilter.prototype.testSync = function (_file) {
        throw new TypeError('applyFilter() filters can only be used with find(). Use applyFilterSync() with findSync()');
    };
    return CustomFilter;
}(AbstractFilePredicate));
exports.CustomFilter = CustomFilter;
_CustomFilter_fn = new WeakMap();
var CustomFilterSync = /** @class */ (function (_super) {
    __extends(CustomFilterSync, _super);
    function CustomFilterSync(fn) {
        var _this = _super.call(this) || this;
        _this[_d] = true;
        _CustomFilterSync_fn.set(_this, void 0);
        __classPrivateFieldSet(_this, _CustomFilterSync_fn, fn, "f");
        return _this;
    }
    CustomFilterSync.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _CustomFilterSync_fn, "f").call(this, file);
    };
    return CustomFilterSync;
}(AbstractFilePredicate));
exports.CustomFilterSync = CustomFilterSync;
_CustomFilterSync_fn = new WeakMap(), _d = sync;
var Size = /** @class */ (function (_super) {
    __extends(Size, _super);
    function Size(sizeExpression) {
        var _this = _super.call(this) || this;
        _Size_isMatch.set(_this, void 0);
        __classPrivateFieldSet(_this, _Size_isMatch, (0, unit_compare_1.parseSize)(sizeExpression), "f");
        return _this;
    }
    Size.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _g = (_f = __classPrivateFieldGet(this, _Size_isMatch, "f")).call;
                        _h = [this];
                        return [4 /*yield*/, file.size()];
                    case 1: return [2 /*return*/, _g.apply(_f, _h.concat([_j.sent()]))];
                }
            });
        });
    };
    Size.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _Size_isMatch, "f").call(this, file.sizeSync());
    };
    return Size;
}(AbstractFilePredicate));
exports.Size = Size;
_Size_isMatch = new WeakMap();
var Modified = /** @class */ (function (_super) {
    __extends(Modified, _super);
    function Modified(expression) {
        var _this = _super.call(this) || this;
        _Modified_isMatch.set(_this, void 0);
        __classPrivateFieldSet(_this, _Modified_isMatch, (0, unit_compare_1.parseAge)(expression), "f");
        return _this;
    }
    Modified.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _g = (_f = __classPrivateFieldGet(this, _Modified_isMatch, "f")).call;
                        _h = [this];
                        return [4 /*yield*/, file.lastModified()];
                    case 1: return [2 /*return*/, _g.apply(_f, _h.concat([_j.sent()]))];
                }
            });
        });
    };
    Modified.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _Modified_isMatch, "f").call(this, file.lastModifiedSync());
    };
    return Modified;
}(AbstractFilePredicate));
exports.Modified = Modified;
_Modified_isMatch = new WeakMap();
var Accessed = /** @class */ (function (_super) {
    __extends(Accessed, _super);
    function Accessed(expression) {
        var _this = _super.call(this) || this;
        _Accessed_isMatch.set(_this, void 0);
        __classPrivateFieldSet(_this, _Accessed_isMatch, (0, unit_compare_1.parseAge)(expression), "f");
        return _this;
    }
    Accessed.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _g = (_f = __classPrivateFieldGet(this, _Accessed_isMatch, "f")).call;
                        _h = [this];
                        return [4 /*yield*/, file.lastAccessed()];
                    case 1: return [2 /*return*/, _g.apply(_f, _h.concat([_j.sent()]))];
                }
            });
        });
    };
    Accessed.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _Accessed_isMatch, "f").call(this, file.lastAccessedSync());
    };
    return Accessed;
}(AbstractFilePredicate));
exports.Accessed = Accessed;
_Accessed_isMatch = new WeakMap();
var Changed = /** @class */ (function (_super) {
    __extends(Changed, _super);
    function Changed(expression) {
        var _this = _super.call(this) || this;
        _Changed_isMatch.set(_this, void 0);
        __classPrivateFieldSet(_this, _Changed_isMatch, (0, unit_compare_1.parseAge)(expression), "f");
        return _this;
    }
    Changed.prototype.test = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _g = (_f = __classPrivateFieldGet(this, _Changed_isMatch, "f")).call;
                        _h = [this];
                        return [4 /*yield*/, file.lastChanged()];
                    case 1: return [2 /*return*/, _g.apply(_f, _h.concat([_j.sent()]))];
                }
            });
        });
    };
    Changed.prototype.testSync = function (file) {
        return __classPrivateFieldGet(this, _Changed_isMatch, "f").call(this, file.lastChangedSync());
    };
    return Changed;
}(AbstractFilePredicate));
exports.Changed = Changed;
_Changed_isMatch = new WeakMap();
var MatchAll = /** @class */ (function (_super) {
    __extends(MatchAll, _super);
    function MatchAll() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this[_e] = true;
        return _this;
    }
    MatchAll.prototype.testSync = function (_file) {
        return true;
    };
    return MatchAll;
}(AbstractFilePredicate));
exports.MatchAll = MatchAll;
_e = sync;
function ext() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var extensions = (0, arrays_js_1.from)(args).map(cleanExtension);
    return new Extension(extensions);
}
exports.ext = ext;
/**
 * Matches every file
 *
 * @returns the predicate
 */
function matchAll() {
    return new MatchAll();
}
exports.matchAll = matchAll;
// The matchers are typed, but JavaScript callers could still pass a number
// where V1 accepted one, so they're told what to use instead
function expressionFor(matcher, expression, example) {
    if (typeof expression !== 'string') {
        throw new TypeError(matcher + "() takes an expression, such as '" + example + "'");
    }
    return expression;
}
/**
 * Matches files by size, using a comparison with optional units, such as
 * `'>10k'` or `'<=1mb'`. The operators are `<`, `<=`, `>`, `>=` and `==`,
 * which is the default, and the units are `b`, `k`, `m`, `g` and `t`, in
 * multiples of 1024. Use {@link sizeEquals} for an exact number of bytes.
 *
 * @param expression - the size expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 * @example
 * ```ts
 * FileHound.create().match(size('>1mb'));
 * ```
 */
function size(expression) {
    return new Size(expressionFor('size', expression, '>1kb'));
}
exports.size = size;
/**
 * Matches files of an exact size
 *
 * @param bytes - the size in bytes
 * @returns the predicate
 * @throws `RangeError`
 * Thrown if bytes is negative or not an integer.
 * @example
 * ```ts
 * FileHound.create().match(sizeEquals(1024));
 * ```
 */
function sizeEquals(bytes) {
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
        throw new RangeError('Size must be a non-negative integer number of bytes');
    }
    return new Size(bytes);
}
exports.sizeEquals = sizeEquals;
/**
 * Matches files with a size of zero bytes
 *
 * @returns the predicate
 */
function isEmpty() {
    return new Size(0);
}
exports.isEmpty = isEmpty;
/**
 * Matches files whose path, relative to the search path, satisfies a glob
 * pattern. Patterns follow Node's `path.matchesGlob` and `fs.glob` rules:
 * `*.json` matches only the top level of the search path, and a leading `**`
 * segment matches at any depth. Wildcards, including `**`, do not match names
 * beginning with a dot.
 *
 * @param globPattern - the glob pattern
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(glob('*.json'));
 * ```
 */
function glob(globPattern) {
    return new Glob(globPattern);
}
exports.glob = glob;
/**
 * Matches files using a custom function, which may be asynchronous. Can only
 * be used with {@link FileHound.find}; use {@link applyFilterSync} with
 * {@link FileHound.findSync}.
 *
 * @param fn - returns, or fulfils with, true for files to include
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(applyFilter(async file => await file.size() > 0));
 * ```
 */
function applyFilter(fn) {
    return new CustomFilter(fn);
}
exports.applyFilter = applyFilter;
/**
 * Matches files using a synchronous custom function. Can be used with both
 * {@link FileHound.find} and {@link FileHound.findSync}.
 *
 * @param fn - returns true for files to include
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(applyFilterSync(file => file.sizeSync() > 0));
 * ```
 */
function applyFilterSync(fn) {
    return new CustomFilterSync(fn);
}
exports.applyFilterSync = applyFilterSync;
/**
 * Matches files whose path satisfies a regular expression pattern
 *
 * @param pattern - the regular expression pattern
 * @returns the predicate
 */
function like(pattern) {
    return new TextMatch(pattern);
}
exports.like = like;
/**
 * Excludes files whose path satisfies any of the given regular expression patterns
 *
 * @param patterns - one or more regular expression patterns
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(discard('node_modules', '\\.git'));
 * ```
 */
function discard() {
    var patterns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        patterns[_i] = arguments[_i];
    }
    if (patterns.length === 1) {
        return new TextMatch(patterns[0]).not();
    }
    return patterns
        .map(function (pattern) { return new TextMatch(pattern); })
        .reduce(function (a, b) { return a.or(b); })
        .not();
}
exports.discard = discard;
function cleanExtension(fileExtension) {
    if (fileExtension.startsWith('.')) {
        return fileExtension.slice(1);
    }
    return fileExtension;
}
/**
 * Matches files by when they were last modified, using a comparison of their
 * age with optional units, such as `'<2 days'` or `'>8h'`. The operators are
 * `<`, `<=`, `>` and `=`, which is the default and compares to the second.
 * The units are minutes (`m`, `min`), hours (`h`) and days (`d`), which is
 * the default.
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 * @example
 * ```ts
 * FileHound.create().match(modified('<2 days'));
 * ```
 */
function modified(expression) {
    return new Modified(expressionFor('modified', expression, '<2 days'));
}
exports.modified = modified;
/**
 * Matches files by when they were last accessed, using an age expression as
 * for {@link modified}
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 */
function accessed(expression) {
    return new Accessed(expressionFor('accessed', expression, '<2 days'));
}
exports.accessed = accessed;
/**
 * Matches files by when their status, such as their permissions, last
 * changed, using an age expression as for {@link modified}
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 */
function changed(expression) {
    return new Changed(expressionFor('changed', expression, '<2 days'));
}
exports.changed = changed;
/**
 * Negates a predicate
 *
 * @param fn - the predicate to negate
 * @returns a predicate that matches when the given one does not
 */
function not(fn) {
    return new Not(fn);
}
exports.not = not;
