import { dirname, resolve } from 'node:path';
import { FileType } from '../filetype.js';
import { isSyncPredicate } from '../matchers.js';
// Every entry has one. FileType is the public subset; anything else, such as a
// socket or FIFO, is OTHER and never matched.
export const EntryType = { ...FileType, OTHER: 'other' };
export function createPathError(name, cause) {
    return new Error(`'${name}' is not a valid path`, { cause });
}
// Search paths are where to search, so must be directories
export function assertDirectory(name, stats) {
    if (!stats.isDirectory()) {
        throw new Error(`'${name}' is not a directory`);
    }
}
// State shared by a walk. The async and sync walks (async.ts and sync.ts) share
// everything except the calls that touch the file system, and both return
// matches in name order.
export class Walk {
    matcher;
    // Checked once, as combined predicates work it out from their parts
    isSyncMatcher;
    #opts;
    constructor(matcher, opts) {
        this.matcher = matcher;
        this.isSyncMatcher = isSyncPredicate(matcher);
        this.#opts = opts;
    }
    get ignoreSymlinks() {
        return this.#opts.ignoreSymlinks;
    }
    isCandidate(file, type) {
        switch (type) {
            case EntryType.DIRECTORY:
                return this.#typeEnabled(type);
            case EntryType.REGULAR:
                return this.#typeEnabled(type) && !(this.#opts.ignoreHiddenFiles && file.isHiddenSync());
            case EntryType.OTHER:
                return false;
        }
    }
    // Hidden directories are neither returned nor walked
    shouldSkipDirectory(dir) {
        return this.#opts.ignoreHiddenDirectories && dir.isHiddenSync();
    }
    // depth counts levels below the root, which is 0. A directory beyond
    // maxDepth is still returned, like any other entry at its level, but not walked.
    canDescend(depth) {
        return this.#opts.maxDepth === undefined || depth <= this.#opts.maxDepth;
    }
    #typeEnabled(type) {
        return this.#opts.fileTypes.includes(type);
    }
}
export function typeOf(kind) {
    return kind.isDirectory() ? EntryType.DIRECTORY : kind.isFile() ? EntryType.REGULAR : EntryType.OTHER;
}
export function byName(a, b) {
    return a.getName() < b.getName() ? -1 : a.getName() > b.getName() ? 1 : 0;
}
export function ancestorsOf(file) {
    const ancestors = [];
    let ancestor = dirname(resolve(file.getName()));
    while (dirname(ancestor) !== ancestor) {
        ancestors.push(ancestor);
        ancestor = dirname(ancestor);
    }
    ancestors.push(ancestor);
    return ancestors;
}
