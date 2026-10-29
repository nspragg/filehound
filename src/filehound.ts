import * as path from 'path';

import { EventEmitter } from 'events';
import { Stats } from 'fs';
import { from } from './arrays';
import { reducePaths } from './files';
import {FilePredicate, matchAll} from './matchers';
import { File } from './file';
import {walkAsync} from './walker/async';
import {walkSync} from './walker/sync';
import {WalkOptions} from './walker/walk';

/**
 * The types of file system entry that a search can return. The values are
 * plain strings, so `'directory'` can be passed in place of `FileType.DIRECTORY`.
 */
export const FileType = {
  /** Regular files only: not sockets, FIFOs or devices */
  REGULAR: 'regular',
  DIRECTORY: 'directory'
} as const;

export type FileType = typeof FileType[keyof typeof FileType];

const fileTypes: readonly string[] = Object.values(FileType);

/**
 * A match returned when {@link FileHound.includeFileStats} is set.
 */
export type FileWithStats = {
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
export class FileHound<T = string> extends EventEmitter {
  #searchPaths: string[];
  #maxDepth?: number;
  #types: FileType[];
  #matchExpression?: FilePredicate;
  #ignoreHiddenFiles = false;
  #ignoreHiddenDirectories = false;
  #ignoreSymlinks = false;
  #includeFileStats = false;
  #queryLocked = false;

  public constructor() {
    super();
    this.#searchPaths = [process.cwd()];
    this.#types = [FileType.REGULAR];
  }

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
  public static create(): FileHound {
    return new FileHound();
  }

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
  public static async any<T>(...args: FileHound<T>[]): Promise<T[]> {
    const pending = args.map(fh => fh.find());
    const files = await Promise.all(pending);

    return files.flat();
  }
  /**
   * Defines the search paths. Duplicate paths are removed and each path
   * is normalised. Defaults to the current working directory.
   *
   * @param paths - one or more paths
   * @returns the FileHound instance
   * @throws `Error`
   * Thrown if the query is locked because a search has started.
   * @example
   * ```ts
   * import { FileHound } from 'filehound';
   *
   * const files = await FileHound.create()
   *   .paths('/tmp', '/etc') // or ['/tmp', '/etc']
   *   .find();
   * ```
   */
  public paths(...paths: string[]): this;
  /**
   * Defines the search paths from an array.
   *
   * @param paths - an array of paths
   * @returns the FileHound instance
   */
  public paths(paths: string[]): this;
  public paths(...args: (string | string[])[]): this {
    this.#throwIfQueryLocked();
    this.#searchPaths = [...new Set(from(args))].map(path.normalize);
    return this;
  }

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
  public match(query: FilePredicate): this {
    this.#throwIfQueryLocked();

    if (query === null || query === undefined || typeof query !== 'object' || typeof query.test !== 'function' || typeof query.testSync !== 'function') {
      throw new TypeError('Match expression must be a valid matcher');
    }

    this.#matchExpression = query;
    return this;
  }

  /**
   * Specify the directory search depth. If set to zero, recursive searching
   * will be disabled
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
  public depth(depth: number): this {
    this.#throwIfQueryLocked();

    if (depth < 0 || !Number.isSafeInteger(depth)) {
      throw new RangeError('Depth must be a positive integer');
    }

    this.#maxDepth = depth;

    return this;
  }

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
  public type(...types: FileType[]): this {
    this.#throwIfQueryLocked();
    this.#validateTypeArguments(types);

    this.#types = types;
    return this;
  }

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
  public ignoreHiddenFiles(): this {
    this.#throwIfQueryLocked();
    this.#ignoreHiddenFiles = true;
    return this;
  }

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
  public ignoreHiddenDirectories(): this {
    this.#throwIfQueryLocked();
    this.#ignoreHiddenDirectories = true;
    return this;
  }

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
  public ignoreSymlinks(): this {
    this.#throwIfQueryLocked();
    this.#ignoreSymlinks = true;
    return this;
  }

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
  public includeFileStats(): FileHound<FileWithStats> {
    this.#throwIfQueryLocked();
    this.#includeFileStats = true;
    return this as FileHound<unknown> as FileHound<FileWithStats>;
  }

  /**
   * Asynchronously executes a file search. Once called, the query is
   * locked and can no longer be modified.
   *
   * @returns a Promise of all matches. If the Promise fulfils,
   * the fulfilment value is an array of all matching files
   *
   * @remarks
   * Emits a `match` event for each matching file, an `error` event if the
   * search fails and an `end` event when the search completes.
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
   */
  public async find(): Promise<T[]> {
    this.#queryLocked = true;

    const searches = [];
    const paths = this.getPaths();

    for (const currentPath of paths) {
      searches.push(this.#searchAsync(currentPath));
    }

    try {
      const files = (await Promise.all(searches)).flat();
      const results = await Promise.all(files.map(file => this.#toResult(file)));
      for (const result of results) {
        this.emit('match', result);
      }
      return results;
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.emit('end');
    }
  }

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
  public findSync(): T[] {
    this.#queryLocked = true;

    return this.getPaths()
      .flatMap(dir => this.#searchSync(dir))
      .map(file => this.#toResultSync(file));
  }

  /**
   * Returns the paths that will be searched. When no depth is set, any path
   * that is a subdirectory of another search path is removed, as it would
   * otherwise be searched twice.
   *
   * @returns a copy of the search paths
   */
  public getPaths(): string[] {
    const paths = this.#maxDepth !== undefined
      ? this.#searchPaths
      : reducePaths(this.#searchPaths);

    return [...paths];
  }

  #throwIfQueryLocked(): void {
    if (this.#queryLocked) {
      throw new Error('Cannot modify query after search has started');
    }
  }

  #validateTypeArguments(types: FileType[]): void {
    if (types.length === 0) {
      throw new RangeError('At least one file type must be specified');
    }

    types.forEach((type) => {
      if (!fileTypes.includes(type)) {
        throw new TypeError(`Invalid file type: ${type}.`);
      }
    });
  }

  #getMatchExpression(): FilePredicate {
    return this.#matchExpression ?? matchAll();
  }

  async #toResult(file: File): Promise<T> {
    if (this.#includeFileStats) {
      return {path: file.getName(), stats: await file.getStats()} as T;
    }
    return file.getName() as T;
  }

  #toResultSync(file: File): T {
    if (this.#includeFileStats) {
      return {path: file.getName(), stats: file.getStatsSync()} as T;
    }
    return file.getName() as T;
  }

  #searchSync(dir: string): File[] {
    return walkSync(dir, this.#getMatchExpression(), this.#getOptions());
  }

  async #searchAsync(dir: string): Promise<File[]> {
    return walkAsync(dir, this.#getMatchExpression(), this.#getOptions());
  }

  #getOptions(): WalkOptions {
    return {
      ignoreHiddenDirectories: this.#ignoreHiddenDirectories,
      ignoreHiddenFiles: this.#ignoreHiddenFiles,
      ignoreSymlinks: this.#ignoreSymlinks,
      maxDepth: this.#maxDepth,
      fileTypes: this.#types
    };
  }
}
