"use strict";
exports.__esModule = true;
exports.reducePaths = exports.isSubDirectory = exports.notSubDirectory = exports.findSubDirectories = void 0;
var path = require("node:path");
// dirname is a fixed point at a root (`/`, `C:\`) and at `.`
function hasParent(parent) {
    return path.dirname(parent) !== parent;
}
function getParent(dir) {
    return path.dirname(dir);
}
function getSubDirectories(base, allPaths) {
    return allPaths.filter(function (candidate) {
        return base !== candidate && isSubDirectory(base, candidate);
    });
}
function findSubDirectories(paths) {
    return paths.flatMap(function (p) { return getSubDirectories(p, paths); });
}
exports.findSubDirectories = findSubDirectories;
function notSubDirectory(subDirs) {
    return function (p) { return !subDirs.includes(p); };
}
exports.notSubDirectory = notSubDirectory;
function isSubDirectory(base, candidate) {
    var parent = candidate;
    while (hasParent(parent)) {
        if (base === parent) {
            return true;
        }
        parent = getParent(parent);
    }
    return false;
}
exports.isSubDirectory = isSubDirectory;
function reducePaths(searchPaths) {
    if (searchPaths.length === 1) {
        return searchPaths;
    }
    var sortedPaths = searchPaths.toSorted();
    var subDirs = findSubDirectories(sortedPaths);
    return sortedPaths.filter(notSubDirectory(subDirs));
}
exports.reducePaths = reducePaths;
