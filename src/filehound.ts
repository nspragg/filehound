import * as _ from 'lodash';
import * as path from 'path';

import { EventEmitter } from 'events';
import {FilePredicate, matchAll} from './matchers';
import { copy, from } from './arrays';
import { reducePaths } from './files';
import * as walker from './walker/walk';

import bind from './bind';

function isDefined(value: any): any {
  return value !== undefined;
}

function flatten(a: string[], b: string[]): string[] {
  return a.concat(b);
}

export enum FileType {
  REGULAR,
  DIRECTORY
}

export class FileHound extends EventEmitter {
  private searchPaths: string[];
  private maxDepth: number;
  private types: FileType[];
  private matchExpression: FilePredicate;
  private _ignoreHiddenFiles: boolean;
  private _ignoreHiddenDirectories: boolean;

  public constructor() {
    super();
    this.searchPaths = [process.cwd()];
    this.types = [FileType.REGULAR];
    bind(this);
  }

  // tslint:disable-next-line:valid-jsdoc
  /**
   * Static factory method to newQuery an instance of FileHound
   *
   * @memberOf FileHound
   * @method
   * newQuery
   * @return FileHound instance
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.newQuery();
   */
  // tslint:disable-next-line:function-name
  public static create(): FileHound {
    return new FileHound();
  }

  // tslint:disable-next-line:valid-jsdoc
  /**
   * Returns all matches from one of more FileHound instances
   *
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
  // tslint:disable-next-line:function-name
  public static async any(...args: FileHound[]): Promise<string[]> {
    const pending = args.map(fh => fh.find());
    const files = await Promise.all(pending);

    // @ts-ignore
    return files.reduce(flatten, []);
  }

  // tslint:disable-next-line:valid-jsdoc
  /**
   * Defines the search paths
   *
   * @memberOf FileHound
   * @method
   * paths
   * @param {array} path - array of paths
   * @return a FileHound instance
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.newQuery();
   * filehound
   *   .paths("/tmp", "/etc") // or ["/tmp", "/etc"]
   *   .find()
   *   .each(console.log);
   */
  public paths(...args: string[]): FileHound {
    this.searchPaths = _.uniq(from(args)).map(path.normalize);
    return this;
  }

  public match(query: FilePredicate): FileHound {
    this.matchExpression = query;
    return this;
  }

  /**
   * Specify the directory search depth. If set to zero, recursive searching
   * will be disabled
   *
   * @memberOf FileHound
   * @method
   * depth
   * @return a FileHound instance
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.newQuery();
   * filehound
   *   .depth(0)
   *   .find()
   *   .each(console.log); // array of files names only in the current directory
   */
  public depth(depth: number): FileHound {
    this.maxDepth = depth;
    return this;
  }


  public type(...types: FileType[]): FileHound {
    if (types.length > 0) {
      this.types = types;
    }

    return this;
  }

  public ignoreHiddenFiles(): FileHound {
    this._ignoreHiddenFiles = true;
    return this;
  }

  public ignoreHiddenDirectories(): FileHound {
    this._ignoreHiddenDirectories = true;
    return this;
  }

  /**
   * Asynchronously executes a file search.
   *
   * @memberOf FileHound
   * @method
   * find
   * @param {function} function - Optionally accepts a callback function
   * @return Returns a Promise of all matches. If the Promise fulfils,
   * the fulfilment value is an array of all matching files
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.newQuery();
   * const files = await filehound.find();
   *
   * console.log(files);
   *
   */
  public async find(): Promise<string[]> {
    const searches = [];
    const paths = this.getPaths();

    for (const currentPath of paths) {
      searches.push(this.searchAsync(currentPath, this.getMatchExpression()));
    }

    try {
      const results = await Promise.all(searches);
      return results
        .reduce(flatten)
        .map((file) => {
          this.emit('match', file);
          return file;
        });
    } catch (e) {
      this.emit('error', e);
      throw e;
    } finally {
      this.emit('end');
    }
  }

  private getMatchExpression() {
    return this.matchExpression == null ? matchAll() : this.matchExpression;
  }

  /**
   * Synchronously executes a file search.
   *
   * @memberOf FileHound
   * @method
   * findSync
   * @return Returns an array of all matching files
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.newQuery();
   * const files = filehound.findSync();
   * console.log(files);
   *
   */
  public findSync(): any[] {
    return this.getPaths()
      .map(this.searchSync)
      .reduce(flatten);
  }

  public getPaths(): string[] {
    const paths = isDefined(this.maxDepth)
      ? this.searchPaths
      : reducePaths(this.searchPaths);

    return copy<string[]>(paths);
  }

  private searchSync(dir: string): string[] {
    return walker.sync(dir, this.getMatchExpression(), {
      ignoreHiddenDirectories: this._ignoreHiddenDirectories,
      maxDepth: this.maxDepth,
      fileTypes: this.types
    });
  }

  private async searchAsync(dir: string, matcher: FilePredicate): Promise<string[]> {
    return walker.async(dir, matcher, {
      ignoreHiddenDirectories: this._ignoreHiddenDirectories,
      ignoreHiddenFiles: this._ignoreHiddenFiles,
      maxDepth: this.maxDepth,
      fileTypes: this.types
    });
  }
}
