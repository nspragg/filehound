"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const File = require("file-js");
const walkSync_1 = require("./walkSync");
const walkAsync_1 = require("./walkAsync");
const TERMINATE = false;
const CONTINUE = true;
function isDefined(value) {
    return value !== undefined;
}
function atMaxDepth(dir, root, opts) {
    const depth = dir.getDepthSync() - root.getDepthSync();
    return isDefined(opts.maxDepth) && depth > opts.maxDepth;
}
function shouldFilterDirectory(dir, root, opts) {
    return (atMaxDepth(dir, root, opts) || (opts.ignoreDirs && dir.isHiddenSync()));
}
function async(dir, isMatch, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const root = File.create(dir);
        const files = [];
        yield walkAsync_1.walkAsync(root, (path) => __awaiter(this, void 0, void 0, function* () {
            if ((yield path.isDirectory()) && shouldFilterDirectory(path, root, opts)) {
                return TERMINATE;
            }
            if (opts.directoriesOnly) {
                if (path !== root && (yield path.isDirectory()) && isMatch(path)) {
                    files.push(path.getName());
                }
            }
            else if (!(yield path.isDirectory()) && isMatch(path)) {
                files.push(path.getName());
            }
            return CONTINUE;
        }));
        return files;
    });
}
exports.async = async;
function sync(dir, isMatch, opts) {
    const root = File.create(dir);
    const files = [];
    walkSync_1.walkSync(root, (path) => {
        if (path.isDirectorySync() && shouldFilterDirectory(path, root, opts)) {
            return TERMINATE;
        }
        if (opts.directoriesOnly) {
            if (path !== root && path.isDirectorySync() && isMatch(path)) {
                files.push(path.getName());
            }
        }
        else if (!path.isDirectorySync() && isMatch(path)) {
            files.push(path.getName());
        }
        return CONTINUE;
    });
    return files;
}
exports.sync = sync;
//# sourceMappingURL=walk.js.map