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
function isDefined(value) {
    return value !== undefined;
}
function flatten(a, b) {
    return a.concat(b);
}
class AsyncWalker {
    constructor(root, dirsOnly, ignoreDirs, maxDepth) {
        this.root = root;
        this.tracked = [];
        this.directoriesOnly = dirsOnly;
        this.ignoreDirs = ignoreDirs;
        this.maxDepth = maxDepth;
    }
    atMaxDepth(dir) {
        const depth = dir.getDepthSync() - this.root.getDepthSync();
        return isDefined(this.maxDepth) && depth > this.maxDepth;
    }
    shouldFilterDirectory(dir) {
        return (this.atMaxDepth(dir) || (this.ignoreDirs && dir.isHiddenSync()));
    }
    search(path, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shouldFilterDirectory(path)) {
                return [];
            }
            return path.getFiles()
                .map((file) => __awaiter(this, void 0, void 0, function* () {
                if (yield file.isDirectory()) {
                    if (!this.shouldFilterDirectory(file)) {
                        this.tracked.push(file);
                    }
                    return this.search(file, filter);
                }
                return file;
            }))
                .reduce(flatten, [])
                .filter(filter);
        });
    }
    walk(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            this.tracked = [];
            const files = yield this.search(this.root, filter);
            if (this.directoriesOnly) {
                return this.tracked.filter(filter);
            }
            return files;
        });
    }
}
exports.AsyncWalker = AsyncWalker;
//# sourceMappingURL=asyncWalker.js.map