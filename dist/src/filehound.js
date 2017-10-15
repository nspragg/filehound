"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const bluebird_1 = require("bluebird");
const path = require("path");
const File = require("file-js");
const functions_1 = require("./functions");
const files_1 = require("./files");
const arrays_1 = require("./arrays");
const unit_compare_1 = require("unit-compare");
const events_1 = require("events");
const bind_1 = require("./bind");
function isDefined(value) {
    return value !== undefined;
}
function flatten(a, b) {
    return a.concat(b);
}
function toFilename(file) {
    return file.getName();
}
function isRegExpMatch(pattern) {
    return file => {
        return new RegExp(pattern).test(file.getName());
    };
}
function cleanExtension(ext) {
    if (_.startsWith(ext, '.')) {
        return ext.slice(1);
    }
    return ext;
}
/** @class */
class FileHound extends events_1.EventEmitter {
    constructor() {
        super();
        this.filters = [];
        this.searchPaths = [];
        this.searchPaths.push(process.cwd());
        this.ignoreDirs = false;
        this.isMatch = _.noop;
        this.sync = false;
        this.directoriesOnly = false;
        bind_1.default(this);
    }
    /**
     * Static factory method to create an instance of FileHound
     *
     * @static
     * @memberOf FileHound
     * @method
     * create
     * @return FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     */
    static create() {
        return new FileHound();
    }
    /**
     * Returns all matches from one of more FileHound instances
     *
     * @static
     * @memberOf FileHound
     * @method
     * any
     * @return a promise containing all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files.
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.any(fh1, fh2);
     */
    static any(...args) {
        return bluebird_1.Promise.all(arrays_1.from(args)).reduce(flatten, []);
    }
    /**
     * Filters by modifiction time
     *
     * @memberOf FileHound
     * @method
     * modified
     * @param {string} dateExpression - date expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .modified("< 2 days")
     *   .find()
     *   .each(console.log);
     */
    modified(pattern) {
        return this.addFilter(file => {
            const modified = file.lastModifiedSync();
            return unit_compare_1.isDate(modified).assert(pattern);
        });
    }
    /**
     * Filters by file access time
     *
     * @memberOf FileHound
     * @method
     * accessed
     * @param {string} dateExpression - date expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .accessed("< 10 minutes")
     *   .find()
     *   .each(console.log);
     */
    accessed(pattern) {
        return this.addFilter(file => {
            const accessed = file.lastAccessedSync();
            return unit_compare_1.isDate(accessed).assert(pattern);
        });
    }
    /**
     * Filters change time
     *
     * @memberOf FileHound
     * @instance
     * @method
     * changed
     * @param {string} dateExpression - date expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .changed("< 10 minutes")
     *   .find()
     *   .each(console.log);
     */
    changed(pattern) {
        return this.addFilter(file => {
            const changed = file.lastChangedSync();
            return unit_compare_1.isDate(changed).assert(pattern);
        });
    }
    /**
     *
     * @memberOf FileHound
     * @instance
     * @method
     * addFilter
     * @param {function} function - custom filter function
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .addFilter(customFilter)
     *   .find()
     *   .each(consoe.log);
     */
    addFilter(filter) {
        this.filters.push(filter);
        return this;
    }
    /**
     * Defines the search paths
     *
     * @memberOf FileHound
     * @instance
     * @method
     * paths
     * @param {array} path - array of paths
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .paths("/tmp", "/etc") // or ["/tmp", "/etc"]
     *   .find()
     *   .each(console.log);
     */
    paths(...args) {
        this.searchPaths = _.uniq(arrays_1.from(args)).map(path.normalize);
        return this;
    }
    /**
     * Define the search path
     *
     * @memberOf FileHound
     * @instance
     * @method
     * path
     * @param {string} path - path
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .path("/tmp")
     *   .find()
     *   .each(console.log);
     */
    path(path) {
        return this.paths(path);
    }
    /**
     * Ignores files or sub-directories matching pattern
     *
     * @memberOf FileHound
     * @instance
     * @method
     * discard
     * @param {string|array} regex - regex or array of regex
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .discard("*.tmp*")
     *   .find()
     *   .each(console.log);
     */
    discard(...args) {
        const patterns = arrays_1.from(args);
        patterns.forEach(pattern => {
            this.addFilter(functions_1.negate(isRegExpMatch(pattern)));
        });
        return this;
    }
    /**
     * Filter on file extension
     *
     * @memberOf FileHound
     * @instance
     * @method
     * ext
     * @param {string|array} extensions - extension or an array of extensions
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * let filehound = FileHound.create();
     * filehound
     *   .ext(".json")
     *   .find()
     *   .each(console.log);
     *
     * // array of extensions to filter by
     * filehound = FileHound.create();
     * filehound
     *   .ext([".json", ".txt"])
     *   .find()
     *   .each(console.log);
     *
     * // supports var args
     * filehound = FileHound.create();
     * filehound
     *   .ext(".json", ".txt")
     *   .find()
     *   .each(console.log);
     */
    ext(...args) {
        const extensions = arrays_1.from(args).map(cleanExtension);
        return this.addFilter(file => _.includes(extensions, file.getPathExtension()));
    }
    /**
     * Filter by file size
     *
     * @memberOf FileHound
     * @instance
     * @method
     * size
     * @param {string} sizeExpression - a size expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .size("<10kb")
     *   .find()
     *   .each(console.log);
     */
    size(sizeExpression) {
        return this.addFilter(file => {
            const size = file.sizeSync();
            return unit_compare_1.isNumber(size).assert(sizeExpression);
        });
    }
    /**
     * Filter by zero length files
     *
     * @memberOf FileHound
     * @instance
     * @method
     * isEmpty
     * @param {string} path - path
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .size("<10kb")
     *   .find()
     *   .each(console.log);
     */
    isEmpty() {
        return this.size(0);
    }
    /**
     * Filter by a file glob
     *
     * @memberOf FileHound
     * @instance
     * @method
     * glob
     * @param {string} glob - file glob
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .glob("*tmp*")
     *   .find()
     *   .each(console.log); // array of files names all containing 'tmp'
     */
    glob(globPattern) {
        return this.match(globPattern);
    }
    /**
     * Same as glob
     * @see glob
     */
    match(globPattern) {
        return this.addFilter(file => file.isMatch(globPattern));
    }
    /**
     * Negates filters
     *
     * @memberOf FileHound
     * @instance
     * @method
     * not
     * @param {string} glob - file glob
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .not()
     *   .glob("*tmp*")
     *   .find()
     *   .each(console.log); // array of files names NOT containing 'tmp'
     */
    not() {
        this.negateFilters = true;
        return this;
    }
    /**
     * Filter to ignore hidden files
     *
     * @memberOf FileHound
     * @instance
     * @method
     * ignoreHiddenFiles
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .ignoreHiddenFiles()
     *   .find()
     *   .each(console.log); // array of files names that are not hidden files
     */
    ignoreHiddenFiles() {
        return this.addFilter(file => !file.isHiddenSync());
    }
    /**
     * Ignore hidden directories
     *
     * @memberOf FileHound
     * @instance
     * @method
     * ignoreHiddenDirectories
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .ignoreHiddenDirectories()
     *   .find()
     *   .each(console.log); // array of files names that are not hidden directories
     */
    ignoreHiddenDirectories() {
        this.ignoreDirs = true;
        return this;
    }
    /**
     * Find sub-directories
     *
     * @memberOf FileHound
     * @instance
     * @method
     * directory
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .directory()
     *   .find()
     *   .each(console.log); // array of matching sub-directories
     */
    directory() {
        this.directoriesOnly = true;
        return this;
    }
    /**
     * Find sockets
     *
     * @memberOf FileHound
     * @instance
     * @method
     * socket
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .socket()
     *   .find()
     *   .each(console.log); // array of matching sockets
     */
    socket() {
        return this.addFilter(file => file.isSocket());
    }
    /**
     * Specify the directory search depth. If set to zero, recursive searching
     * will be disabled
     *
     * @memberOf FileHound
     * @instance
     * @method
     * depth
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .depth(0)
     *   .find()
     *   .each(console.log); // array of files names only in the current directory
     */
    depth(depth) {
        this.maxDepth = depth;
        return this;
    }
    /**
     * Asynchronously executes a file search.
     *
     * @memberOf FileHound
     * @instance
     * @method
     * find
     * @param {function} function - Optionally accepts a callback function
     * @return Returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .find()
     *   .each(console.log);
     *
     * // using a callback
     * filehound
     *   .find((err, files) => {
     *      if (err) return console.error(err);
     *
     *      console.log(files);
     *   });
     */
    find() {
        this.initFilters();
        const paths = this.getSearchPaths();
        const searches = bluebird_1.Promise.map(paths, this.searchAsync);
        return bluebird_1.Promise.all(searches)
            .reduce(flatten)
            .map(toFilename)
            .catch(e => {
            this.emit('error', e);
            throw e;
        })
            .finally(() => this.emit('end'));
    }
    /**
     * Synchronously executes a file search.
     *
     * @memberOf FileHound
     * @instance
     * @method
     * findSync
     * @return Returns an array of all matching files
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * const files = filehound.findSync();
     * console.log(files);
     *
     */
    findSync() {
        this.initFilters();
        return this.getSearchPaths()
            .map(this.searchSync)
            .reduce(flatten)
            .map(toFilename);
    }
    getSearchPaths() {
        const paths = isDefined(this.maxDepth)
            ? this.searchPaths
            : files_1.reducePaths(this.searchPaths);
        return arrays_1.copy(paths);
    }
    atMaxDepth(root, dir) {
        const depth = dir.getDepthSync() - root.getDepthSync();
        return isDefined(this.maxDepth) && depth > this.maxDepth;
    }
    shouldFilterDirectory(root, dir) {
        return (this.atMaxDepth(root, dir) || (this.ignoreDirs && dir.isHiddenSync()));
    }
    newMatcher() {
        const isMatch = functions_1.compose(this.filters);
        if (this.negateFilters) {
            return functions_1.negate(isMatch);
        }
        return isMatch;
    }
    initFilters() {
        this.isMatch = this.newMatcher();
    }
    searchSync(dir) {
        this.sync = true;
        const root = File.create(dir);
        const trackedPaths = [];
        const files = this.search(root, root, trackedPaths);
        return this.directoriesOnly ? trackedPaths.filter(this.isMatch) : files;
    }
    searchAsync(dir) {
        const root = File.create(dir);
        const trackedPaths = [];
        const pending = this.search(root, root, trackedPaths);
        return pending.then(files => {
            if (this.directoriesOnly)
                return trackedPaths.filter(this.isMatch);
            files.forEach(file => {
                this.emit('match', file.getName());
            });
            return files;
        });
    }
    search(root, path, trackedPaths) {
        if (this.shouldFilterDirectory(root, path))
            return [];
        const getFiles = this.sync
            ? path.getFilesSync.bind(path)
            : path.getFiles.bind(path);
        return getFiles()
            .map(file => {
            if (file.isDirectorySync()) {
                if (!this.shouldFilterDirectory(root, file))
                    trackedPaths.push(file);
                return this.search(root, file, trackedPaths);
            }
            return file;
        })
            .reduce(flatten, [])
            .filter(this.isMatch);
    }
}
exports.default = FileHound;
//# sourceMappingURL=filehound.js.map