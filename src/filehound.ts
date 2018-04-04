import * as _ from 'lodash';
import * as path from 'path';
import * as File from 'file-js';

import { reducePaths } from './files';
import { copy, from } from './arrays';
import { isDate, isNumber } from 'unit-compare';
import { EventEmitter } from 'events';
import { Matcher } from './matcher';
import { walkSync } from './walkSync';
import { walkAsync } from './walkAsync';

import bind from './bind';

const TERMINATE = false;
const CONTINUE = true;

function isDefined(value: any): any {
  return value !== undefined;
}

function flatten(a: File[], b: File[]): File[] {
  return a.concat(b);
}

function toFilename(file: File): string {
  return file.getName();
}

function cleanExtension(ext: string): string {
  if (_.startsWith(ext, '.')) {
    return ext.slice(1);
  }
  return ext;
}

/** @class */
class FileHound extends EventEmitter {
  private matcher: Matcher;
  private searchPaths: string[];
  private ignoreDirs: boolean;
  private directoriesOnly: boolean;
  private maxDepth: number;

  public constructor() {
    super();
    this.matcher = new Matcher();
    this.searchPaths = [];
    this.searchPaths.push(process.cwd());
    this.ignoreDirs = false;
    this.directoriesOnly = false;
    bind(this);
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public static create(): FileHound {
    return new FileHound();
  }
  // tslint:disable-next-line:valid-jsdoc
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
  public static async any(...args: FileHound[]): Promise<string[]> {
    const pending = args.map(fh => fh.find());
    const files = await Promise.all(pending);

    return files.reduce(flatten, []);
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public modified(pattern): FileHound {
    return this.addFilter((file) => {
      const modified = file.lastModifiedSync();
      return isDate(modified)
        .assert(pattern);
    });
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public accessed(pattern): FileHound {
    return this.addFilter((file) => {
      const accessed = file.lastAccessedSync();
      return isDate(accessed)
        .assert(pattern);
    });
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public changed(pattern): FileHound {
    return this.addFilter((file) => {
      const changed = file.lastChangedSync();
      return isDate(changed)
        .assert(pattern);
    });
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public addFilter(filter): FileHound {
    this.matcher.on(filter);
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public paths(...args): FileHound {
    this.searchPaths = _.uniq(from(args))
      .map(path.normalize);
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc

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
  public path(path): FileHound {
    return this.paths(path);
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public discard(...args): FileHound {
    const patterns = from(args);
    patterns.forEach((pattern) => {
      this.addFilter(Matcher.negate(Matcher.isMatch(pattern)));
    });
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public ext(...args): FileHound {
    const extensions = from(args)
      .map(cleanExtension);
    return this.addFilter(file => _.includes(extensions, file.getPathExtension())
    );
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public size(sizeExpression): FileHound {
    return this.addFilter((file) => {
      const size = file.sizeSync();
      return isNumber(size)
        .assert(sizeExpression);
    });
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public isEmpty(): FileHound {
    return this.size(0);
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public glob(globPattern): FileHound {
    return this.match(globPattern);
  }

  // tslint:disable-next-line:valid-jsdoc
  /**
   * Same as glob
   * @see glob
   */
  public match(globPattern): FileHound {
    return this.addFilter(file => file.isMatch(globPattern));
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public not(): FileHound {
    this.matcher.negateAll();
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public ignoreHiddenFiles(): FileHound {
    return this.addFilter(file => !file.isHiddenSync());
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public ignoreHiddenDirectories(): FileHound {
    this.ignoreDirs = true;
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public directory(): FileHound {
    this.directoriesOnly = true;
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public socket(): FileHound {
    return this.addFilter(file => file.isSocket());
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public depth(depth): FileHound {
    this.maxDepth = depth;
    return this;
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public async find(): Promise<string[]> {
    const paths: string[] = this.getSearchPaths();
    const searches = [];
    for (const path of paths) {
      searches.push(this.searchAsync(path));
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
    } finally {
      this.emit('end');
    }
  }

  // tslint:disable-next-line:valid-jsdoc
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
  public findSync(): string[] {
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

  private atMaxDepth(dir, root): boolean {
    const depth = dir.getDepthSync() - root.getDepthSync();
    return isDefined(this.maxDepth) && depth > this.maxDepth;
  }

  private shouldFilterDirectory(dir, root): boolean {
    return (this.atMaxDepth(dir, root) || (this.ignoreDirs && dir.isHiddenSync()));
  }

  private searchSync(dir: string): File[] {
    const root = File.create(dir);
    const files = [];
    const isMatch = this.matcher.create();

    walkSync(root, (path) => {
      if (path.isDirectorySync() && this.shouldFilterDirectory(path, root)) {
        return TERMINATE;
      }

      if (this.directoriesOnly) {
        if (path !== root && path.isDirectorySync() && isMatch(path)) {
          files.push(path.getName());
        }
      } else if (!path.isDirectorySync() && isMatch(path)) {
        files.push(path.getName());
      }

      return CONTINUE;
    });

    return files;
  }

  private async searchAsync(dir: string): Promise<string[]> {
    const root = File.create(dir);
    const files = [];
    const isMatch = this.matcher.create();

    await walkAsync(root, async (path) => {
      if (await path.isDirectory() && this.shouldFilterDirectory(path, root)) {
        return TERMINATE;
      }
      if (this.directoriesOnly) {
        if (path !== root && await path.isDirectory() && isMatch(path)) {
          files.push(path.getName());
        }
      } else if (!await path.isDirectory() && isMatch(path)) {
        files.push(path.getName());
      }
      return CONTINUE;
    });

    return files;
  }
}

export default FileHound;
