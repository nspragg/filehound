/// <reference types="node" />
import { EventEmitter } from 'node:events';
import type { Stats } from 'node:fs';
import { FilePredicate } from './matchers.js';
import { FileType } from './filetype.js';
/**
 * Options for {@link FileHound.find} and {@link FileHound.iterate}.
 */
export declare type SearchOptions = {
    /**
     * Stops the search when aborted. The search then rejects with the
     * signal's reason, which is an `AbortError` unless another is given.
     */
    signal?: AbortSignal;
};
/**
 * A match returned when {@link FileHound.includeFileStats} is set.
 */
export declare type FileWithStats = {
    /** the path of the matching file */
    path: string;
    /** the file's stats, as returned by `fs.stat` */
    stats: Stats;
};
/**
 * A fluent query for searching the file system.
 *
 * @typeParam T - the type of each match: a path, or a {@link FileWithStats}
 * when {@link FileHound.includeFileStats} is set
 *
 * @remarks
 * Configure a query by chaining methods, then run it with {@link FileHound.find}
 * or {@link FileHound.findSync}. Once a search has started the query is locked
 * and can no longer be modified.
 *
 * @example
 * ```ts
 * import { FileHound, ext } from 'filehound';
 *
 * const files = await FileHound.create()
 *   .paths('/tmp')
 *   .match(ext('json'))
 *   .depth(1)
 *   .find();
 * ```
 */
export declare class FileHound<T = string> extends EventEmitter {
    #private;
    constructor();
    /**
     * Static factory method to create an instance of FileHound
     *
     * @returns a new FileHound instance
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const filehound = FileHound.create();
     * ```
     */
    static create(): FileHound;
    /**
     * Executes one or more FileHound queries and combines their results
     *
     * @param args - the FileHound instances to execute
     * @returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all files matched by any of the queries
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.any(fh1, fh2);
     * ```
     */
    static any<T>(...args: FileHound<T>[]): Promise<T[]>;
    /**
     * Defines the search paths: the directories to search. Duplicate paths are
     * removed and each path is normalised. Defaults to the current working directory.
     *
     * @param paths - one or more directory paths
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started. A path that
     * doesn't exist, or isn't a directory, is rejected when the search runs.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .paths('/tmp', '/etc') // or ['/tmp', '/etc']
     *   .find();
     * ```
     */
    paths(...paths: string[]): this;
    /**
     * Defines the search paths from an array.
     *
     * @param paths - an array of paths
     * @returns the FileHound instance
     */
    paths(paths: string[]): this;
    /**
     * Specifies the criteria that files must satisfy to be included in the
     * results. Defaults to matching all files.
     *
     * @param query - the predicate used to test each file
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @throws `TypeError`
     * Thrown if the query is not a valid matcher.
     * @example
     * ```ts
     * import { FileHound, ext } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .match(ext('json'))
     *   .find();
     * ```
     */
    match(query: FilePredicate): this;
    /**
     * Specify the directory search depth. If set to zero, recursive searching
     * will be disabled. Directories at the limit are not searched, but are
     * still returned when {@link FileHound.type} includes directories.
     *
     * @param depth - the maximum search depth (a non-negative integer)
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @throws `RangeError`
     * Thrown if depth is negative or not an integer.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .depth(0)
     *   .find(); // array of file names only in the current directory
     * ```
     */
    depth(depth: number): this;
    /**
     * Specifies the types of file system entry to return. Defaults to
     * regular files only.
     *
     * @param types - one or more file types
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @throws `RangeError`
     * Thrown if no file types are given.
     * @throws `TypeError`
     * Thrown if an invalid file type is given.
     * @example
     * ```ts
     * import { FileHound, FileType } from 'filehound';
     *
     * const directories = await FileHound.create()
     *   .type(FileType.DIRECTORY)
     *   .find();
     * ```
     */
    type(...types: FileType[]): this;
    /**
     * Excludes hidden files (names beginning with a dot) from the results
     *
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .ignoreHiddenFiles()
     *   .find();
     * ```
     */
    ignoreHiddenFiles(): this;
    /**
     * Excludes hidden directories (names beginning with a dot), and their
     * contents, from the search
     *
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .ignoreHiddenDirectories()
     *   .find();
     * ```
     */
    ignoreHiddenDirectories(): this;
    /**
     * Excludes symbolic links from the search. Linked files are not matched
     * and linked directories are not searched.
     *
     * @remarks
     * By default, symbolic links are followed: a linked file is matched as its
     * target and a linked directory is searched. Broken links, and links back to
     * a directory already being searched, are always skipped.
     *
     * @returns the FileHound instance
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .ignoreSymlinks()
     *   .find();
     * ```
     */
    ignoreSymlinks(): this;
    /**
     * Returns each match with its stats, as `{ path, stats }`, in place of
     * its path. Stats already fetched by a predicate are reused.
     *
     * @returns the FileHound instance, typed to return {@link FileWithStats} matches
     * @throws `Error`
     * Thrown if the query is locked because a search has started.
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const files = await FileHound.create()
     *   .includeFileStats()
     *   .find();
     *
     * files.forEach(({ path, stats }) => console.log(path, stats.size));
     * ```
     */
    includeFileStats(): FileHound<FileWithStats>;
    /**
     * Asynchronously executes a file search. Once called, the query is
     * locked and can no longer be modified.
     *
     * @param options - a signal to stop the search
     * @returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files
     *
     * @remarks
     * Emits a `match` event for each matching file, an `error` event if the
     * search fails or is aborted and an `end` event when the search completes.
     *
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const filehound = FileHound.create();
     * const files = await filehound.find();
     *
     * console.log(files);
     * ```
     * @example
     * Giving up on a search after five seconds:
     * ```ts
     * const files = await FileHound.create()
     *   .paths('/')
     *   .find({ signal: AbortSignal.timeout(5000) });
     * ```
     */
    find(options?: SearchOptions): Promise<T[]>;
    /**
     * Asynchronously executes a file search, returning matches one at a time
     * as they are found, in the same order as {@link FileHound.find}. Once
     * called, the query is locked and can no longer be modified.
     *
     * @remarks
     * The search runs ahead of the loop by a bounded amount, so a large search
     * can be read without holding every match in memory. Breaking out of the
     * loop stops the search.
     *
     * Emits a `match` event as each match is returned, an `error` event if the
     * search fails or is aborted and an `end` event when the search finishes:
     * when every match has been returned, the search fails or is aborted, or
     * the loop is left early.
     *
     * @param options - a signal to stop the search
     * @returns an async iterator of matches
     * @example
     * ```ts
     * import { FileHound, ext } from 'filehound';
     *
     * const query = FileHound.create()
     *   .paths('/tmp')
     *   .match(ext('json'));
     *
     * for await (const file of query.iterate()) {
     *   console.log(file);
     * }
     * ```
     */
    iterate(options?: SearchOptions): AsyncGenerator<T>;
    /**
     * Synchronously executes a file search. Once called, the query is
     * locked and can no longer be modified. No events are emitted.
     *
     * @returns an array of all matching files
     * @example
     * ```ts
     * import { FileHound } from 'filehound';
     *
     * const filehound = FileHound.create();
     * const files = filehound.findSync();
     * console.log(files);
     * ```
     */
    findSync(): T[];
    /**
     * Returns the paths that will be searched. When no depth is set, any path
     * that is a subdirectory of another search path is removed, as it would
     * otherwise be searched twice.
     *
     * @returns a copy of the search paths
     */
    getPaths(): string[];
}
