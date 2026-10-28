import * as path from 'path';

import { EventEmitter } from 'events';
import { from } from './arrays';
import { reducePaths } from './files';
import {FilePredicate, matchAll} from './matchers';
import * as walker from './walker/walk';

/**
 * The types of file system entry that a search can return.
 */
export enum FileType {
  REGULAR,
  DIRECTORY
}

/**
 * A fluent query for searching the file system.
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
export class FileHound extends EventEmitter {
  private searchPaths: string[];
  private maxDepth: number;
  private types: FileType[];
  private matchExpression: FilePredicate;
  private _ignoreHiddenFiles: boolean;
  private _ignoreHiddenDirectories: boolean;
  private queryLocked: boolean;

  public constructor() {
    super();
    this.searchPaths = [process.cwd()];
    this.types = [FileType.REGULAR];
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
  public static async any(...args: FileHound[]): Promise<string[]> {
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
  public paths(...paths: string[]): FileHound;
  /**
   * Defines the search paths from an array.
   *
   * @param paths - an array of paths
   * @returns the FileHound instance
   */
  public paths(paths: string[]): FileHound;
  public paths(...args: (string | string[])[]): FileHound {
    this.throwIfQueryLocked();
    this.searchPaths = [...new Set(from(args))].map(path.normalize);
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
  public match(query: FilePredicate): FileHound {
    this.throwIfQueryLocked();

    if (query === null || query === undefined || typeof query !== 'object' || typeof query.test !== 'function') {
      throw new TypeError('Match expression must be a valid matcher');
    }

    this.matchExpression = query;
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
  public depth(depth: number): FileHound {
    this.throwIfQueryLocked();

    if (depth < 0 || !Number.isSafeInteger(depth)) {
      throw new RangeError('Depth must be a positive integer');
    }

    this.maxDepth = depth;

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
  public type(...types: FileType[]): FileHound {
    this.throwIfQueryLocked();
    this.validateTypeArguments(types);

    this.types = types;
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
  public ignoreHiddenFiles(): FileHound {
    this.throwIfQueryLocked();
    this._ignoreHiddenFiles = true;
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
  public ignoreHiddenDirectories(): FileHound {
    this.throwIfQueryLocked();
    this._ignoreHiddenDirectories = true;
    return this;
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
  public async find(): Promise<string[]> {
    this.queryLocked = true;

    const searches = [];
    const paths = this.getPaths();

    for (const currentPath of paths) {
      searches.push(this.searchAsync(currentPath));
    }

    try {
      const results = await Promise.all(searches);
      return results
        .flat()
        .map((file) => {
          this.emit('match', file);
          return file;
        });
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
  public findSync(): string[] {
    this.queryLocked = true;

    return this.getPaths()
      .map(dir => this.searchSync(dir))
      .flat();
  }

  /**
   * Returns the paths that will be searched. When no depth is set, any path
   * that is a subdirectory of another search path is removed, as it would
   * otherwise be searched twice.
   *
   * @returns a copy of the search paths
   */
  public getPaths(): string[] {
    const paths = this.maxDepth !== undefined
      ? this.searchPaths
      : reducePaths(this.searchPaths);

    return [...paths];
  }

  private throwIfQueryLocked(): void {
    if (this.queryLocked) {
      throw new Error('Cannot modify query after search has started');
    }
  }

  private validateTypeArguments(types: FileType[]): void {
    if (types.length === 0) {
      throw new RangeError('At least one file type must be specified');
    }

    types.forEach((type) => {
      if (!Object.values(FileType).includes(type)) {
        throw new TypeError(`Invalid file type: ${type}.`);
      }
    });
  }

  private getMatchExpression(): FilePredicate {
    return this.matchExpression ?? matchAll();
  }

  private searchSync(dir: string): string[] {
    return walker.sync(dir, this.getMatchExpression(), this.getOptions());
  }

  private async searchAsync(dir: string): Promise<string[]> {
    return walker.async(dir, this.getMatchExpression(), this.getOptions());
  }

  private getOptions(): walker.WalkOptions {
    return {
      ignoreHiddenDirectories: this._ignoreHiddenDirectories,
      ignoreHiddenFiles: this._ignoreHiddenFiles,
      maxDepth: this.maxDepth,
      fileTypes: this.types
    };
  }
}
