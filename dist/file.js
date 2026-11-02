var _a;
import { constants, lstatSync, readdirSync, statSync } from 'node:fs';
import * as path from 'node:path';
import * as fsp from 'node:fs/promises';
// What only the walker needs. These are functions rather than methods, so a
// predicate can't reach them. Only code inside File can see its private
// fields, so they're set from its static block.
let knownKindOf;
let childrenOf;
let childrenOfSync;
// The kind readdir gave, so needs no I/O. Undefined for links, whose targets
// are reported, and for files made without a dirent, such as a walk's root.
export function getKnownKind(file) {
    return knownKindOf(file);
}
// A directory's entries, with their kinds from readdir
export function getChildren(dir) {
    return childrenOf(dir);
}
export function getChildrenSync(dir) {
    return childrenOfSync(dir);
}
export class File {
    #dir;
    #pathname;
    // Type info from readdir, saving a stat call
    #dirent;
    // The directory a search started from; glob patterns are matched relative to it
    #root;
    // Fetched once, so predicates and results share a single stat call
    #stats;
    static {
        knownKindOf = file => file.#dirent?.isSymbolicLink() ? undefined : file.#dirent;
        childrenOf = async (dir) => dir.#children();
        childrenOfSync = dir => dir.#childrenSync();
    }
    constructor(pathname, dirent, root) {
        this.#dir = process.cwd();
        this.#pathname = pathname;
        this.#dirent = dirent;
        this.#root = root;
    }
    isDirectorySync() {
        return this.#getKindSync().isDirectory();
    }
    isFileSync() {
        return this.#getKindSync().isFile();
    }
    async isDirectory() {
        return (await this.#getKind()).isDirectory();
    }
    async isFile() {
        return (await this.#getKind()).isFile();
    }
    isSymbolicLinkSync() {
        return this.#dirent?.isSymbolicLink() ?? lstatSync(this.#pathname).isSymbolicLink();
    }
    async isSymbolicLink() {
        return this.#dirent?.isSymbolicLink() ?? (await fsp.lstat(this.#pathname)).isSymbolicLink();
    }
    isHiddenSync() {
        if (!this.isDirectorySync()) {
            return this.#isHiddenFile();
        }
        return this.#isHiddenDirectory();
    }
    async isHidden() {
        if (!await this.isDirectory()) {
            return this.#isHiddenFile();
        }
        return this.#isHiddenDirectory();
    }
    getName() {
        return this.#pathname;
    }
    getAbsolutePath() {
        return path.resolve(this.#dir, this.#pathname);
    }
    getCanonicalPath() {
        return path.normalize(this.getAbsolutePath());
    }
    // Relative to the search root, or the working directory like fs.glob
    getRelativePath() {
        return path.relative(this.#root ?? this.#dir, this.#pathname);
    }
    getPathExtension() {
        return path.extname(this.#pathname).substring(1);
    }
    lastModifiedSync() {
        return this.getStatsSync().mtime;
    }
    lastAccessedSync() {
        return this.getStatsSync().atime;
    }
    lastChangedSync() {
        return this.getStatsSync().ctime;
    }
    sizeSync() {
        return this.getStatsSync().size;
    }
    async lastModified() {
        return (await this.getStats()).mtime;
    }
    async lastAccessed() {
        return (await this.getStats()).atime;
    }
    async lastChanged() {
        return (await this.getStats()).ctime;
    }
    async size() {
        return (await this.getStats()).size;
    }
    getStatsSync() {
        this.#stats ??= statSync(this.#pathname);
        return this.#stats;
    }
    async getStats() {
        this.#stats ??= await fsp.stat(this.#pathname);
        return this.#stats;
    }
    async isWritable() {
        return this.#access(constants.W_OK);
    }
    async isReadable() {
        return this.#access(constants.R_OK);
    }
    async isExecutable() {
        return this.#access(constants.X_OK);
    }
    async exists() {
        return this.#access(constants.R_OK);
    }
    isMatch(globPattern) {
        return path.matchesGlob(this.getRelativePath(), globPattern);
    }
    async #children() {
        if (!await this.isDirectory()) {
            return [];
        }
        const prefix = this.#childPrefix();
        return (await fsp.readdir(this.#pathname, { withFileTypes: true })).map(entry => this.#child(prefix, entry));
    }
    #childrenSync() {
        if (!this.isDirectorySync()) {
            return [];
        }
        const prefix = this.#childPrefix();
        return readdirSync(this.#pathname, { withFileTypes: true }).map(entry => this.#child(prefix, entry));
    }
    // path.join is the costliest step of a walk, so it runs once per directory
    // rather than once per entry. Entry names never contain a separator, so
    // prefix + name is exactly what path.join would give.
    #childPrefix() {
        return path.join(this.#pathname, '_').slice(0, -1);
    }
    #child(prefix, entry) {
        return new _a(prefix + entry.name, entry, this.#root ?? this.#pathname);
    }
    #getKindSync() {
        return knownKindOf(this) ?? this.getStatsSync();
    }
    async #getKind() {
        return knownKindOf(this) ?? this.getStats();
    }
    #isHiddenFile() {
        return (/^\./).test(path.basename(this.#pathname));
    }
    // Normalising first means either separator is handled on Windows
    #isHiddenDirectory() {
        return path.normalize(this.#pathname)
            .split(path.sep)
            .some(segment => segment.startsWith('.') && segment !== '.' && segment !== '..');
    }
    async #access(permission) {
        try {
            await fsp.access(this.#pathname, permission);
        }
        catch {
            return false;
        }
        return true;
    }
}
_a = File;
