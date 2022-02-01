import { EventEmitter } from "events";
import * as Bluebird from "bluebird";

declare module 'filehound' {
  class FileHound extends EventEmitter {
    constructor();

    /**
     * Static factory method to create an instance of FileHound
     *
     * @static
     * @memberof FileHound
     * @method create
     * @returns FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     */
    public static create(): FileHound;

    /**
     * Returns all matches from one of more FileHound instances
     *
     * @static
     * @memberof FileHound
     * @method any
     * @returns a promise containing all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files.
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.any(fh1, fh2);
     */
    public static any(...filehounds: FileHound[]): Bluebird<string[]>;

    /**
     * Filters by modifiction time
     *
     * @memberof FileHound
     * @method modified
     * @param { string } dateExpression - date expression
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .modified("< 2 days")
     *  .find()
     *  .each(console.log);
     */
    public modified(pattern: string): FileHound;

    /**
     * Filters by file access time
     *
     * @memberof FileHound
     * @method accessed
     * @param { string } dateExpression - date expression
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .accessed("< 10 minutes")
     *  .find()
     *  .each(console.log);
     */
    public accesssed(pattern: string): FileHound;

    /**
     * Filters change time
     *
     * @memberof FileHound
     * @instance
     * @method changed
     * @param { string } dateExpression - date expression
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .changed("< 10 minutes")
     *  .find()
     *  .each(console.log);
     */
    public changed(pattern: string): FileHound;

    /**
     *
     * @memberof FileHound
     * @instance
     * @method addFilter
     * @param { function } function - custom filter function
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .addFilter(customFilter)
     *  .find()
     *  .each(console.log);
     */
    public addFilter(filter: (...args: any[]) => boolean): FileHound;

    /**
     * Defines the search paths
     *
     * @memberof FileHound
     * @instance
     * @method paths
     * @param { array } path - array of paths
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .paths("/tmp", "/etc") // or ["/tmp", "/etc"]
     *  .find()
     *  .each(console.log);
     */
    public paths(...paths: string[] | [string[]]): FileHound;

    /**
     * Define the search path
     *
     * @memberof FileHound
     * @instance
     * @method path
     * @param { string } path - path
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .path("/tmp")
     *  .find()
     *  .each(console.log);
     */
    public path(path: string): FileHound;

    /**
     * Ignores files or sub-directories matching pattern
     *
     * @memberof FileHound
     * @instance
     * @method discard
     * @param { string | array } regex - regex or array of regex
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .discard("*.tmp*")
     *  .find()
     *  .each(console.log);
     */
    public discard(regex: string | string[]): FileHound;

    /**
     * Filter on file extension
     *
     * @memberof FileHound
     * @instance
     * @method ext
     * @param { string | array } extensions - extension or an array of extensions
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * let filehound = FileHound.create();
     * filehound
     *  .ext(".json")
     *  .find()
     *  .each(console.log);
     *
     * // array of extensions to filter by
     * filehound = FileHound.create();
     * filehound
     *  .ext([".json", ".txt"])
     *  .find()
     *  .each(console.log);
     *
     * // supports var args
     * filehound = FileHound.create();
     * filehound
     *  .ext(".json", ".txt")
     *  .find()
     *  .each(console.log);
     */
    public ext(extensions: string | string[]): FileHound;

    /**
     * Filter by file size
     *
     * @memberof FileHound
     * @instance
     * @method size
     * @param { string } sizeExpression - a size expression
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .size("<10kb")
     *  .find()
     *  .each(console.log);
     */
    public size(sizeExpression: string): FileHound;

    /**
     * Filter by zero length files
     *
     * @memberof FileHound
     * @instance
     * @method isEmpty
     * @param { string } path - path
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .ext('txt')
     *  .isEmpty()
     *  .find()
     *  .each(console.log);
     */
    public isEmpty(path?: string): FileHound;

    /**
     * Filter by a file glob
     *
     * @memberof FileHound
     * @instance
     * @method glob
     * @param { array } glob - array of globs
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .glob(['*tmp*']) // .glob('*tmp*') || .glob('*tmp1*','*tmp2*')
     *  .find()
     *  .each(console.log); // array of files names all containing 'tmp'
     */
    public glob(...glob: string[]): FileHound;


    /**
     * Same as glob
     * @see glob
     */
    public match(...globPatterns: string[]): FileHound;

    /**
     * Negates filters
     *
     * @memberof FileHound
     * @instance
     * @method not
     * @param { string } glob - file glob
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .not()
     *  .glob("*tmp*")
     *  .find()
     *  .each(console.log); // array of files names NOT containing 'tmp'
     */
    public not(glob?: string): FileHound;

    /**
     * Filter to ignore hidden files
     *
     * @memberof FileHound
     * @instance
     * @method ignoreHiddenFiles
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .ignoreHiddenFiles()
     *  .find()
     *  .each(console.log); // array of files names that are not hidden files
     */
    public ignoreHiddenFiles(): FileHound;

    /**
     * Ignore hidden directories
     *
     * @memberof FileHound
     * @instance
     * @method ignoreHiddenDirectories
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .ignoreHiddenDirectories()
     *  .find()
     *  .each(console.log); // array of files names that are not hidden directories
     */
    public ignoreHiddenDirectories(): FileHound;

    /**
     * Include file stats
     *
     * @memberof FileHound
     * @instance
     * @method includeFileStats
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .includeFileStats()
     *  .find()
     *  .each(console.log); // array of file objects containing `path` and `stats` properties
     */
    public includeFileStats(): FileHound;

    /**
     * Find sub-directories
     *
     * @memberof FileHound
     * @instance
     * @method directory
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .directory()
     *  .find()
     *  .each(console.log); // array of matching sub-directories
     */
    public directory(): FileHound;

    /**
     * Find sockets
     *
     * @memberof FileHound
     * @instance
     * @method socket
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .socket()
     *  .find()
     *  .each(console.log); // array of matching sockets
     */
    public socket(): FileHound;

    /**
     * Specify the directory search depth. If set to zero, recursive searching
     * will be disabled
     *
     * @memberof FileHound
     * @instance
     * @method depth
     * @returns a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .depth(0)
     *  .find()
     *  .each(console.log); // array of files names only in the current directory
     */
    public depth(depth: number): FileHound;

    /**
     * Asynchronously executes a file search.
     *
     * @memberof FileHound
     * @instance
     * @method find
     * @param {function} function - Optionally accepts a callback function
     * @returns Returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *  .find()
     *  .each(console.log);
     *
     * // using a callback
     * filehound
     *  .find((err, files) => {
     *     if (err) return console.error(err);
     *     console.log(files);
     *  });
     */
    public find(callback?: (err: Error, files: string[]) => void): Bluebird<string[]>;

    /**
    * Synchronously executes a file search.
    *
    * @memberof FileHound
    * @instance
    * @method findSync
    * @returns Returns an array of all matching files
    * @example
    * import FileHound from 'filehound';
    *
    * const filehound = FileHound.create();
    * const files = filehound.findSync();
    * console.log(files);
    */
    public findSync(): string[];

  }
  export function create(): FileHound;
}
