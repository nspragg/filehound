"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getDirNames(dir) {
    const names = dir.getFilesSync();
    return names.sort();
}
function walkSync(path, fn) {
    if (!path.isDirectorySync()) {
        return fn(path);
    }
    const cont = fn(path);
    if (!cont) {
        return;
    }
    const names = getDirNames(path);
    for (const name of names) {
        walkSync(name, fn);
    }
}
exports.walkSync = walkSync;
//# sourceMappingURL=walkSync.js.map