"use strict";
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
var _File_instances, _a, _File_dir, _File_pathname, _File_dirent, _File_root, _File_stats, _File_children, _File_childrenSync, _File_childPrefix, _File_child, _File_getKindSync, _File_getKind, _File_isHiddenFile, _File_isHiddenDirectory, _File_access;
exports.__esModule = true;
exports.File = exports.getChildrenSync = exports.getChildren = exports.getKnownKind = void 0;
var node_fs_1 = require("node:fs");
var path = require("node:path");
var fsp = require("node:fs/promises");
// What only the walker needs. These are functions rather than methods, so a
// predicate can't reach them. Only code inside File can see its private
// fields, so they're set from its static block.
var knownKindOf;
var childrenOf;
var childrenOfSync;
// The kind readdir gave, so needs no I/O. Undefined for links, whose targets
// are reported, and for files made without a dirent, such as a walk's root.
function getKnownKind(file) {
    return knownKindOf(file);
}
exports.getKnownKind = getKnownKind;
// A directory's entries, with their kinds from readdir
function getChildren(dir) {
    return childrenOf(dir);
}
exports.getChildren = getChildren;
function getChildrenSync(dir) {
    return childrenOfSync(dir);
}
exports.getChildrenSync = getChildrenSync;
var File = /** @class */ (function () {
    function File(pathname, dirent, root) {
        _File_instances.add(this);
        _File_dir.set(this, void 0);
        _File_pathname.set(this, void 0);
        // Type info from readdir, saving a stat call
        _File_dirent.set(this, void 0);
        // The directory a search started from; glob patterns are matched relative to it
        _File_root.set(this, void 0);
        // Fetched once, so predicates and results share a single stat call
        _File_stats.set(this, void 0);
        __classPrivateFieldSet(this, _File_dir, process.cwd(), "f");
        __classPrivateFieldSet(this, _File_pathname, pathname, "f");
        __classPrivateFieldSet(this, _File_dirent, dirent, "f");
        __classPrivateFieldSet(this, _File_root, root, "f");
    }
    File.prototype.isDirectorySync = function () {
        return __classPrivateFieldGet(this, _File_instances, "m", _File_getKindSync).call(this).isDirectory();
    };
    File.prototype.isFileSync = function () {
        return __classPrivateFieldGet(this, _File_instances, "m", _File_getKindSync).call(this).isFile();
    };
    File.prototype.isDirectory = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _File_instances, "m", _File_getKind).call(this)];
                    case 1: return [2 /*return*/, (_b.sent()).isDirectory()];
                }
            });
        });
    };
    File.prototype.isFile = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _File_instances, "m", _File_getKind).call(this)];
                    case 1: return [2 /*return*/, (_b.sent()).isFile()];
                }
            });
        });
    };
    File.prototype.isSymbolicLinkSync = function () {
        var _b, _c;
        return (_c = (_b = __classPrivateFieldGet(this, _File_dirent, "f")) === null || _b === void 0 ? void 0 : _b.isSymbolicLink()) !== null && _c !== void 0 ? _c : (0, node_fs_1.lstatSync)(__classPrivateFieldGet(this, _File_pathname, "f")).isSymbolicLink();
    };
    File.prototype.isSymbolicLink = function () {
        var _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!((_c = (_b = __classPrivateFieldGet(this, _File_dirent, "f")) === null || _b === void 0 ? void 0 : _b.isSymbolicLink()) !== null && _c !== void 0)) return [3 /*break*/, 1];
                        _d = _c;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, fsp.lstat(__classPrivateFieldGet(this, _File_pathname, "f"))];
                    case 2:
                        _d = (_e.sent()).isSymbolicLink();
                        _e.label = 3;
                    case 3: return [2 /*return*/, _d];
                }
            });
        });
    };
    File.prototype.isHiddenSync = function () {
        if (!this.isDirectorySync()) {
            return __classPrivateFieldGet(this, _File_instances, "m", _File_isHiddenFile).call(this);
        }
        return __classPrivateFieldGet(this, _File_instances, "m", _File_isHiddenDirectory).call(this);
    };
    File.prototype.isHidden = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.isDirectory()];
                    case 1:
                        if (!(_b.sent())) {
                            return [2 /*return*/, __classPrivateFieldGet(this, _File_instances, "m", _File_isHiddenFile).call(this)];
                        }
                        return [2 /*return*/, __classPrivateFieldGet(this, _File_instances, "m", _File_isHiddenDirectory).call(this)];
                }
            });
        });
    };
    File.prototype.getName = function () {
        return __classPrivateFieldGet(this, _File_pathname, "f");
    };
    File.prototype.getAbsolutePath = function () {
        return path.resolve(__classPrivateFieldGet(this, _File_dir, "f"), __classPrivateFieldGet(this, _File_pathname, "f"));
    };
    File.prototype.getCanonicalPath = function () {
        return path.normalize(this.getAbsolutePath());
    };
    // Relative to the search root, or the working directory like fs.glob
    File.prototype.getRelativePath = function () {
        var _b;
        return path.relative((_b = __classPrivateFieldGet(this, _File_root, "f")) !== null && _b !== void 0 ? _b : __classPrivateFieldGet(this, _File_dir, "f"), __classPrivateFieldGet(this, _File_pathname, "f"));
    };
    File.prototype.getPathExtension = function () {
        return path.extname(__classPrivateFieldGet(this, _File_pathname, "f")).substring(1);
    };
    File.prototype.lastModifiedSync = function () {
        return this.getStatsSync().mtime;
    };
    File.prototype.lastAccessedSync = function () {
        return this.getStatsSync().atime;
    };
    File.prototype.lastChangedSync = function () {
        return this.getStatsSync().ctime;
    };
    File.prototype.sizeSync = function () {
        return this.getStatsSync().size;
    };
    File.prototype.lastModified = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getStats()];
                    case 1: return [2 /*return*/, (_b.sent()).mtime];
                }
            });
        });
    };
    File.prototype.lastAccessed = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getStats()];
                    case 1: return [2 /*return*/, (_b.sent()).atime];
                }
            });
        });
    };
    File.prototype.lastChanged = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getStats()];
                    case 1: return [2 /*return*/, (_b.sent()).ctime];
                }
            });
        });
    };
    File.prototype.size = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getStats()];
                    case 1: return [2 /*return*/, (_b.sent()).size];
                }
            });
        });
    };
    File.prototype.getStatsSync = function () {
        var _b;
        __classPrivateFieldSet(this, _File_stats, (_b = __classPrivateFieldGet(this, _File_stats, "f")) !== null && _b !== void 0 ? _b : (0, node_fs_1.statSync)(__classPrivateFieldGet(this, _File_pathname, "f")), "f");
        return __classPrivateFieldGet(this, _File_stats, "f");
    };
    File.prototype.getStats = function () {
        var _b;
        return __awaiter(this, void 0, void 0, function () {
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _c = [this, _File_stats];
                        if (!((_b = __classPrivateFieldGet(this, _File_stats, "f")) !== null && _b !== void 0)) return [3 /*break*/, 1];
                        _d = _b;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, fsp.stat(__classPrivateFieldGet(this, _File_pathname, "f"))];
                    case 2:
                        _d = _e.sent();
                        _e.label = 3;
                    case 3:
                        __classPrivateFieldSet.apply(void 0, _c.concat([_d, "f"]));
                        return [2 /*return*/, __classPrivateFieldGet(this, _File_stats, "f")];
                }
            });
        });
    };
    File.prototype.isWritable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [2 /*return*/, __classPrivateFieldGet(this, _File_instances, "m", _File_access).call(this, node_fs_1.constants.W_OK)];
            });
        });
    };
    File.prototype.isReadable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [2 /*return*/, __classPrivateFieldGet(this, _File_instances, "m", _File_access).call(this, node_fs_1.constants.R_OK)];
            });
        });
    };
    File.prototype.isExecutable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [2 /*return*/, __classPrivateFieldGet(this, _File_instances, "m", _File_access).call(this, node_fs_1.constants.X_OK)];
            });
        });
    };
    File.prototype.exists = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [2 /*return*/, __classPrivateFieldGet(this, _File_instances, "m", _File_access).call(this, node_fs_1.constants.R_OK)];
            });
        });
    };
    File.prototype.isMatch = function (globPattern) {
        return path.matchesGlob(this.getRelativePath(), globPattern);
    };
    return File;
}());
exports.File = File;
_a = File, _File_dir = new WeakMap(), _File_pathname = new WeakMap(), _File_dirent = new WeakMap(), _File_root = new WeakMap(), _File_stats = new WeakMap(), _File_instances = new WeakSet(), _File_children = function _File_children() {
    return __awaiter(this, void 0, void 0, function () {
        var prefix;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, this.isDirectory()];
                case 1:
                    if (!(_b.sent())) {
                        return [2 /*return*/, []];
                    }
                    prefix = __classPrivateFieldGet(this, _File_instances, "m", _File_childPrefix).call(this);
                    return [4 /*yield*/, fsp.readdir(__classPrivateFieldGet(this, _File_pathname, "f"), { withFileTypes: true })];
                case 2: return [2 /*return*/, (_b.sent()).map(function (entry) { return __classPrivateFieldGet(_this, _File_instances, "m", _File_child).call(_this, prefix, entry); })];
            }
        });
    });
}, _File_childrenSync = function _File_childrenSync() {
    var _this = this;
    if (!this.isDirectorySync()) {
        return [];
    }
    var prefix = __classPrivateFieldGet(this, _File_instances, "m", _File_childPrefix).call(this);
    return (0, node_fs_1.readdirSync)(__classPrivateFieldGet(this, _File_pathname, "f"), { withFileTypes: true }).map(function (entry) { return __classPrivateFieldGet(_this, _File_instances, "m", _File_child).call(_this, prefix, entry); });
}, _File_childPrefix = function _File_childPrefix() {
    return path.join(__classPrivateFieldGet(this, _File_pathname, "f"), '_').slice(0, -1);
}, _File_child = function _File_child(prefix, entry) {
    var _b;
    return new File(prefix + entry.name, entry, (_b = __classPrivateFieldGet(this, _File_root, "f")) !== null && _b !== void 0 ? _b : __classPrivateFieldGet(this, _File_pathname, "f"));
}, _File_getKindSync = function _File_getKindSync() {
    var _b;
    return (_b = knownKindOf(this)) !== null && _b !== void 0 ? _b : this.getStatsSync();
}, _File_getKind = function _File_getKind() {
    var _b;
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_c) {
            return [2 /*return*/, (_b = knownKindOf(this)) !== null && _b !== void 0 ? _b : this.getStats()];
        });
    });
}, _File_isHiddenFile = function _File_isHiddenFile() {
    return (/^\./).test(path.basename(__classPrivateFieldGet(this, _File_pathname, "f")));
}, _File_isHiddenDirectory = function _File_isHiddenDirectory() {
    return path.normalize(__classPrivateFieldGet(this, _File_pathname, "f"))
        .split(path.sep)
        .some(function (segment) { return segment.startsWith('.') && segment !== '.' && segment !== '..'; });
}, _File_access = function _File_access(permission) {
    return __awaiter(this, void 0, void 0, function () {
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fsp.access(__classPrivateFieldGet(this, _File_pathname, "f"), permission)];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _b = _c.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/, true];
            }
        });
    });
};
(function () {
    knownKindOf = function (file) { var _b; return ((_b = __classPrivateFieldGet(file, _File_dirent, "f")) === null || _b === void 0 ? void 0 : _b.isSymbolicLink()) ? undefined : __classPrivateFieldGet(file, _File_dirent, "f"); };
    childrenOf = function (dir) { return __awaiter(void 0, void 0, void 0, function () { return __generator(_a, function (_b) {
        return [2 /*return*/, __classPrivateFieldGet(dir, _File_instances, "m", _File_children).call(dir)];
    }); }); };
    childrenOfSync = function (dir) { return __classPrivateFieldGet(dir, _File_instances, "m", _File_childrenSync).call(dir); };
})();
