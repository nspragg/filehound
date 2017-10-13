"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const os = require("os");
function flatten(a, b) {
    return a.concat(b);
}
function hasParent(parent) {
    const root = getRoot(parent);
    return parent && (parent !== root && parent !== '.');
}
function getParent(dir) {
    return path.dirname(dir);
}
function getRoot(dir) {
    return os.platform() === 'win32'
        ? dir.split(path.sep)[0] + path.sep
        : path.sep;
}
exports.getRoot = getRoot;
function getSubDirectories(base, allPaths) {
    return allPaths.filter(candidate => {
        return base !== candidate && isSubDirectory(base, candidate);
    });
}
function findSubDirectories(paths) {
    return paths
        .map(path => {
        return getSubDirectories(path, paths);
    })
        .reduce(flatten, []);
}
exports.findSubDirectories = findSubDirectories;
function notSubDirectory(subDirs) {
    return path => {
        return !_.includes(subDirs, path);
    };
}
exports.notSubDirectory = notSubDirectory;
function isSubDirectory(base, candidate) {
    let parent = candidate;
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
    const subDirs = findSubDirectories(searchPaths.sort());
    return searchPaths.filter(notSubDirectory(subDirs));
}
exports.reducePaths = reducePaths;
//# sourceMappingURL=files.js.map