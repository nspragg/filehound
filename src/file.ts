import {
    constants,
    createReadStream,
    createWriteStream,
    existsSync,
    readdirSync,
    Stats,
    statSync
  } from 'fs';
  import * as fileGlob from 'minimatch';
  import * as path from 'path';
  import * as fsp from './fsp';
  
  interface CopyOpts {
    overwrite?: boolean;
    source?: string;
  }
  
  function joinWith(dir: string): (s: string) => string {
    return (file) => {
      return path.join(dir, file);
    };
  }
  
  export class File {
    private dir: string;
    private pathname: string;
  
    constructor(pathname: string) {
      this.dir = process.cwd();
      this.pathname = pathname;
    }
  
    /**
     * Synchronously determine if pathname is a directory
     *
     * @memberOf File
     * @method
     * isDirectorySync
     * @return boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * if (file.isDirectorySync()) {
     *    console.log('processing directory');
     * }
     */
    public isDirectorySync(): boolean {
      return this.getStatsSync().isDirectory();
    }
  
    /**
     * Synchronously determine if pathname is a socket
     *
     * @memberOf File
     * @method
     * isSocketSync
     * @return boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('mysocket');
     * if (file.isSocketSync()) {
     *    console.log('processing socket');
     * }
     */
    public isSocketSync(): boolean {
      return this.getStatsSync().isSocket();
    }
  
    /**
     * Synchronously determine if pathname is a file
     *
     * @memberOf File
     * @method
     * isFileSync
     * @return boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * if (file.isFileSync()) {
     *    console.log('processing file');
     * }
     */
    public isFileSync(): boolean {
      return this.getStatsSync().isFile();
    }
  
    /**
     * Determine if pathname is a directory
     *
     * @memberOf File
     * @method
     * isDirectory
     * @return If the Promise fulfils, the fulfilment value is
     * a boolean indicating if the pathname is a directory
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * const isDirectory = await file.isDirectory((isDirectory);
     * console.log(isDirectory);
     */
    public async isDirectory(): Promise<boolean> {
      return this.checkAsyncStats('isDirectory');
    }
  
    /**
     * Determine if pathname is a Socket
     *
     * @memberOf File
     * @method
     * isSocket
     * @return If the Promise fulfils, the fulfilment value is
     * a boolean indicating if the pathname is a Socket
     * @example
     * import File from 'file-js';
     *
     * const file = new File('mySocket');
     * const isSocket = await file.isSocket((isSocket));
     * console.log(isSocket);
     */
    public async isSocket(): Promise<boolean> {
      return this.checkAsyncStats('isSocket');
    }
  
    /**
     * Determine if pathname is a file
     *
     * @memberOf File
     * @method
     * isFile
     * @return If the Promise fulfils, the fulfilment value is
     * a boolean indicating if the pathname is a file
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * const isFile = await file.isFile();
     * console.log(isFile);
     */
    public async isFile(): Promise<boolean> {
      return this.checkAsyncStats('isFile');
    }
  
    /**
     * Synchronously determine if pathname is a hidden file
     *
     * @memberOf File
     * @method
     * isHiddenSync
     * @return boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./myHiddenFile');
     * if (file.isHiddenSync()) {
     *    console.log('processing hidden file');
     * }
     */
    public isHiddenSync(): boolean {
      if (!this.isDirectorySync()) {
        return this.isHiddenFile();
      }
      return this.isHiddenDirectory();
    }
  
    /**
     * Determine if pathname is a file
     *
     * @memberOf File
     * @method
     * isHidden
     * @return If the Promise fulfils, the fulfilment value is
     * a boolean indicating if the pathname is a hidden file
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * const isHidden = await file.isHidden();
     * console.log(isHidden);
     */
    public async isHidden(): Promise<boolean> {
      if (!await this.isDirectory()) {
        return this.isHiddenFile();
      }
      return this.isHiddenDirectory();
    }
  
    /**
     * Synchronously get list of files, if pathname is a directory
     *
     * @memberOf File
     * @method
     * getListSync
     * @return array of files
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./myHiddenFile');
     * const files = file.getListSync();
     * console.log(files);
     */
    public getListSync(): string[] {
      if (this.isDirectorySync()) {
        return readdirSync(this.pathname)
          .map((file) => {
            return path.join(this.pathname, file);
          });
      }
      return null;
    }
  
    /**
     * Get list of file objects, if pathname is a directory
     *
     * @memberOf File
     * @method
     * getList
     * @return a promise. If the Promise fulfils, the fulfilment value is
     * a list of pathnames
     * @example
     * import File from 'file-js';
     *
     * // get all json files
     * const file = new File('./myDirectory');
     * const files = await file.getFiles('*.json');
     * console.log(jsonFiles);
     */
    public async getList(glob?: string): Promise<string[]> {
      const files = await this.getFiles(glob);
      if (files.length > 0) {
        return files.map(pathname => pathname.getName());
      }
      return [];
    }
  
    /**
     * Get list of file objects, if pathname is a directory
     *
     * @memberOf File
     * @method
     * getFiles
     * @return a promise. If the Promise fulfils, the fulfilment value is
     * a list of File objects
     * @example
     * import File from 'file-js';
     *
     * // get last modified time of all json files
     * const file = new File('./myDirectory');
     * const files = await file.getFiles('*.json');
     * console.log(jsonFiles.map(file => file.lastModifiedSync()));
     */
    public async getFiles(glob?: string): Promise<File[]> {
      if (!await this.isDirectory()) { return []; }
  
      const files = await fsp.readdir(this.pathname);
      const results = files
        .map(joinWith(this.pathname))
        .map(pathname => new File(pathname));
  
      if (results.length === 0) { return []; }
      if (glob) { return results.filter(file => file.isMatch(glob)); }
  
      return results;
    }
  
    /**
     * Synchronously get list of file objects, if pathname is a directory
     *
     * @memberOf File
     * @method
     * getFileSync
     * @return array of files
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./myHiddenFile');
     * const files = file.getFileSync();
     * console.log(files);
     */
    public getFilesSync(glob?: string): File[] {
      if (this.isDirectorySync()) {
        const files = this.getListSync()
          .map((pathname) => {
            return new File(pathname);
          });
  
        if (glob) { return files.filter(file => file.isMatch(glob)); }
  
        return files;
      }
      return null;
    }
  
    /**
     * Synchronously calculate the depth of a directory
     *
     * @memberOf File
     * @method
     * getDepthSync
     * @return boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * console.log(file.getDepthSync());
     */
    public getDepthSync(): number {
      if (!this.isDirectorySync()) {
        return this.depth(path.dirname(this.pathname));
      }
      return this.depth(this.pathname);
    }
  
    /**
     * Returns the pathname as a string
     *
     * @memberOf File
     * @method
     * getName
     * @return String
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myDirectory');
     * console.log(file.getName());
     */
    public getName(): string {
      return this.pathname;
    }
  
    /**
     * Returns the absolutePath
     *
     * @memberOf File
     * @method
     * getAbsolutePath
     * @return String
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myFile');
     * console.log(file.getAbsolutePath());
     */
    public getAbsolutePath(): string {
      if (path.isAbsolute(this.pathname)) {
        return this.pathname;
      }
      return [this.dir, this.pathname].join(path.sep);
    }
  
    /**
     * Returns the canonical path
     *
     * @memberOf File
     * @method
     * getCanonicalPath
     * @return String
     * @example
     * import File from 'file-js';
     *
     * const file = new File('myFile');
     * console.log(file.getCanonicalPath());
     */
    public getCanonicalPath(): string {
      return path.normalize(this.getAbsolutePath());
    }
  
    /**
     * Returns the file extension.
     *
     * @memberOf File
     * @method
     * getPathExtension
     * @return String
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.getPathExtension()); // sh
     */
    public getPathExtension(): string {
      return path.extname(this.pathname).substring(1);
    }
  
    /**
     * Returns the last modified date.
     *
     * @memberOf File
     * @method
     * lastModifiedSync
     * @return Date
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.lastModifiedSync());
     */
    public lastModifiedSync(): Date {
      return this.getStatsSync().mtime;
    }
  
    /**
     * Returns the last the file was accessed.
     *
     * @memberOf File
     * @method
     * lastAccessedSync
     * @return Date
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.lastAccessedSync());
     */
    public lastAccessedSync(): Date {
      return this.getStatsSync().atime;
    }
  
    /**
     * Returns the last the file was changed.
     *
     * @memberOf File
     * @method
     * lastChangedSync
     * @return Date
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.lastChangedSync());
     */
    public lastChangedSync(): Date {
      return this.getStatsSync().ctime;
    }
  
    /**
     * Returns the size of the file.
     *
     * @memberOf File
     * @method
     * sizeSync
     * @return Date
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.sizeSync());
     */
    public sizeSync(): number {
      return this.getStatsSync().size;
    }
  
    /**
     * Returns true if the file is writable
     *
     * @memberOf File
     * @method
     * isWritable
     * @return Boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.isWritable());
     */
    public async isWritable(): Promise<boolean> {
      return this.access(constants.W_OK);
    }
  
    /**
     * Returns true if the file is readable
     *
     * @memberOf File
     * @method
     * isReadable
     * @return Boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.isReadable());
     */
    public async isReadable(): Promise<boolean> {
      return this.access(constants.R_OK);
    }
  
    /**
     * Returns true if the file is executable
     *
     * @memberOf File
     * @method
     * isExecutable
     * @return Boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.sizeSync());
     */
    public async isExecutable(): Promise<boolean> {
      return this.access(constants.X_OK);
    }
  
    /**
     * Deletes the file.
     *
     * @memberOf File
     * @method
     * delete
     * @return void
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * file.delete();
     */
    public async delete(): Promise<void> {
      return fsp.unlink(this.pathname);
    }
  
    /**
     * Recursively delete the folder and contents.
     *
     * @memberOf File
     * @method
     * deleteRecursively
     * @return void
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./dir/');
     * file.deleteRecursively();
     */
    public async deleteRecursively(dirPath: string = this.pathname): Promise<void> {
      if (this.exists()) {
        const files = await fsp.readdir(dirPath);
  
        for (const file of files) {
          const curPath = `${dirPath}/${file}`;
  
          const isDirectory = (await fsp.lstat(curPath)).isDirectory();
          const isFile = (await fsp.lstat(curPath)).isFile();
          if (isDirectory) {
            const hasFiles = (await fsp.readdir(curPath)).length > 0;
            if (hasFiles) {
              await this.deleteRecursively(curPath);
            }
          }
          if (isFile) {
            await fsp.unlink(curPath);
          }
        }
        await fsp.rmdir(dirPath);
      }
    }
  
     /**
      * Recursively copy the folder and contents.
      *
      * @memberOf File
      * @method
      * copyRecursively
      * @return : void
      * @example
      * import File from 'file-js';
      *
      * const file = new File('dir/');
      * file.copyRecursively('destination/');
      */
    public async copyRecursively(destination: string, opts: CopyOpts = { overwrite: false }): Promise<void> {
      if (!opts.source) { opts.source = this.pathname; }
      // check if destination directory already exists
      const directoryExists = existsSync(destination);
      if (directoryExists && !opts.overwrite) {
        throw new Error(`Directory: "${destination}" already exists.`);
      } else if (directoryExists && opts.overwrite) {
        await this.deleteRecursively(destination);
      }
  
      // make destination directory
      await fsp.mkdir(destination);
  
      // get source directory files
      const files = await fsp.readdir(opts.source);
  
      // copy source directory contents into destination directory
      for (const i of files.keys()) {
        const current = await fsp.stat(this.createPath(opts.source, files[i]));
        if (current.isDirectory()) {
          const newSource = this.createPath(opts.source, files[i]);
          const newDestination = this.createPath(destination, files[i]);
          await this.copyRecursively(newDestination, { overwrite: opts.overwrite, source: newSource });
        } else if (current.isSymbolicLink()) {
          const symlink = await fsp.readLink(this.createPath(opts.source, files[i]));
          await fsp.symLink(symlink, this.createPath(destination, files[i]));
        } else {
          this.copy(opts.source, destination, files[i]);
        }
      }
    }
  
    /**
     * Returns true if the file exists
     *
     * @memberOf File
     * @method
     * exists
     * @return Boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.exists());
     */
    public async exists(): Promise<boolean> {
      return this.access(constants.R_OK);
    }
  
    /**
     * Returns true if the given file glob matches
     *
     * @memberOf File
     * @method
     * isMatch
     * @return Boolean
     * @example
     * import File from 'file-js';
     *
     * const file = new File('./tmp.sh');
     * console.log(file.isMatch());
     */
    public isMatch(globPattern: string): boolean {
      const glob = new fileGlob.Minimatch(globPattern, {
        matchBase: true
      });
      return glob.match(this.pathname);
    }
  
    private getStatsSync(): Stats {
      return statSync(this.pathname);
    }
  
    private async getStats(): Promise<Stats> {
      return fsp.stat(this.pathname);
    }
  
    private isHiddenFile(): boolean {
      return (/^\./).test(path.basename(this.pathname));
    }
  
    private isHiddenDirectory(): boolean {
      return (/(^|\/)\.[^\/\.]/g).test(this.pathname);
    }
  
    private depth(pathname: string): number {
      return pathname.split(path.sep).length - 1;
    }
  
    private async access(permission: number): Promise<boolean> {
      try {
        await fsp.access(this.pathname, permission);
      } catch (err) {
        return false;
      }
      return true;
    }
  
    private async checkAsyncStats(type: string): Promise<boolean> {
      const stats = await this.getStats();
      return stats[type]();
    }
  
    private copy(src: string, dest: string, files: string): void {
      const sourcePath = this.createPath(src, files);
      const destPath = this.createPath(dest, files);
      const oldFile = createReadStream(sourcePath);
      const newFile = createWriteStream(destPath);
      oldFile.pipe(newFile);
    }
  
    private createPath(directory: string, file: string): string {
      return path.join(directory, file);
    }
  }
  