import {File} from 'file-js';
import * as _ from 'lodash';
import * as path from 'path';

import {EventEmitter} from 'events';
import {FilePredicate, FileType, Predicate} from '../src/matchers';
import {copy, from} from './arrays';
import {reducePaths} from './files';
import * as walker2 from './walker/walk';

import bind from './bind';
import {MatchBuilder} from './matchBuilder';

function isDefined(value: any): any {
  return value !== undefined;
}

function flatten(a: File[], b: File[]): File[] {
  return a.concat(b);
}

export class FileHound extends EventEmitter {
  private searchPaths: string[];
  private readonly ignoreDirs: boolean;
  private directoriesOnly: boolean;
  private maxDepth: number;
  private matchBuilder: MatchBuilder;

  public constructor() {
    super();
    this.matchBuilder = new MatchBuilder();
    this.searchPaths = [process.cwd()];
    this.ignoreDirs = false;
    this.directoriesOnly = false;
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
  public static newQuery(): FileHound {
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

  public match(...predicates: FilePredicate[]): FileHound {
    this.matchBuilder.add(...predicates);
    return this;
  }

  /**
   * Find sub-directories
   *
   * @memberOf FileHound
   * @method
   * directory
   * @return a FileHound instance
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.newQuery();
   * filehound
   *   .directory()
   *   .find()
   *   .each(console.log); // array of matching sub-directories
   */
  public directory(): FileHound {
    this.directoriesOnly = true;
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
    const paths = this.getSearchPaths();
    for (const currentPath of paths) {
      searches.push(this.searchAsync2(currentPath));
    }

    // const searches = paths.map(this.searchAsync2);

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
    return this.getSearchPaths()
      .map(this.searchSync)
      .reduce(flatten);
  }

  public getSearchPaths(): string[] {
    const paths = isDefined(this.maxDepth)
      ? this.searchPaths
      : reducePaths(this.searchPaths);

    return copy<string[]>(paths);
  }

  private searchSync(dir: string): File[] {
    return walker2.sync(dir, this.matchBuilder.build(), {
      ignoreDirs: this.ignoreDirs,
      maxDepth: this.maxDepth,
      directoriesOnly: this.matchBuilder.fileType === FileType.S_IFDIR
    });
  }

  private async searchAsync2(dir: string): Promise<string[]> {
    return walker2.async(dir, this.matchBuilder.build(), {
      ignoreDirs: this.ignoreDirs,
      maxDepth: this.maxDepth,
      directoriesOnly: this.matchBuilder.fileType === FileType.S_IFDIR
    });
  }
}
