"use strict";
exports.__esModule = true;
exports.walkSync = void 0;
var fs = require("node:fs");
var file_js_1 = require("../file.js");
var walk_js_1 = require("./walk.js");
// A linked directory that resolves to one of its own ancestors would be walked forever
function isCyclicLink(link) {
    var target = fs.realpathSync(link.getName());
    return (0, walk_js_1.ancestorsOf)(link).some(function (ancestor) { return fs.realpathSync(ancestor) === target; });
}
// Broken links are skipped, as are all links when ignoreSymlinks is set
function isVisitableLink(link, walk) {
    if (walk.ignoreSymlinks) {
        return false;
    }
    try {
        return !(link.isDirectorySync() && isCyclicLink(link));
    }
    catch (_a) {
        return false;
    }
}
// Links have no known kind, so need a stat
function visitUntyped(file, walk, depth, matches) {
    return visitTyped(file, (0, walk_js_1.typeOf)(file.getStatsSync()), walk, depth, matches);
}
function visitLink(link, walk, depth, matches) {
    return isVisitableLink(link, walk) ? visitUntyped(link, walk, depth, matches) : matches;
}
// Entries are visited depth first in name order, adding to a single list of matches
function visitTyped(file, type, walk, depth, matches) {
    if (type === walk_js_1.EntryType.DIRECTORY && walk.shouldSkipDirectory(file)) {
        return matches;
    }
    if (walk.isCandidate(file, type) && walk.matcher.testSync(file)) {
        matches.push(file);
    }
    if (type === walk_js_1.EntryType.DIRECTORY && walk.canDescend(depth)) {
        visitChildren(file, walk, depth + 1, matches);
    }
    return matches;
}
// Children always have a dirent, so only links lack a known kind
function visitChildren(dir, walk, depth, matches) {
    for (var _i = 0, _a = (0, file_js_1.getChildrenSync)(dir).sort(walk_js_1.byName); _i < _a.length; _i++) {
        var child = _a[_i];
        var kind = (0, file_js_1.getKnownKind)(child);
        if (kind) {
            visitTyped(child, (0, walk_js_1.typeOf)(kind), walk, depth, matches);
        }
        else {
            visitLink(child, walk, depth, matches);
        }
    }
    return matches;
}
function walkSync(dir, matcher, opts) {
    var root = new file_js_1.File(dir);
    var stats;
    try {
        stats = root.getStatsSync();
    }
    catch (error) {
        throw (0, walk_js_1.createPathError)(dir, error);
    }
    (0, walk_js_1.assertDirectory)(dir, stats);
    // The root is never a match, only the place to search, so the walk starts at its children
    return visitChildren(root, new walk_js_1.Walk(matcher, opts), 1, []);
}
exports.walkSync = walkSync;
