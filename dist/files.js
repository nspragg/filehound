import * as path from 'node:path';
// dirname is a fixed point at a root (`/`, `C:\`) and at `.`
function hasParent(parent) {
    return path.dirname(parent) !== parent;
}
function getParent(dir) {
    return path.dirname(dir);
}
function getSubDirectories(base, allPaths) {
    return allPaths.filter((candidate) => {
        return base !== candidate && isSubDirectory(base, candidate);
    });
}
export function findSubDirectories(paths) {
    return paths.flatMap(p => getSubDirectories(p, paths));
}
export function notSubDirectory(subDirs) {
    return (p) => !subDirs.includes(p);
}
export function isSubDirectory(base, candidate) {
    let parent = candidate;
    while (hasParent(parent)) {
        if (base === parent) {
            return true;
        }
        parent = getParent(parent);
    }
    return false;
}
export function reducePaths(searchPaths) {
    if (searchPaths.length === 1) {
        return searchPaths;
    }
    const sortedPaths = searchPaths.toSorted();
    const subDirs = findSubDirectories(sortedPaths);
    return sortedPaths.filter(notSubDirectory(subDirs));
}
