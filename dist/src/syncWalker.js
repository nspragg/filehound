"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDefined(value) {
    return value !== undefined;
}
function flatten(a, b) {
    return a.concat(b);
}
class SyncWalker {
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
        if (this.shouldFilterDirectory(path)) {
            return [];
        }
        return path.getFilesSync()
            .map((file) => {
            if (file.isDirectorySync()) {
                if (!this.shouldFilterDirectory(file)) {
                    this.tracked.push(file);
                }
                return this.search(file, filter);
            }
            return file;
        })
            .reduce(flatten, [])
            .filter(filter);
    }
    walk(filter) {
        this.tracked = [];
        const files = this.search(this.root, filter);
        if (this.directoriesOnly) {
            return this.tracked.filter(filter);
        }
        return files;
    }
}
exports.SyncWalker = SyncWalker;
//# sourceMappingURL=syncWalker.js.map