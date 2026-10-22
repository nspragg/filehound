import {
  constants,
  createReadStream,
  createWriteStream,
  readdirSync,
  Stats,
  statSync
} from 'fs';
import * as fileGlob from 'minimatch';
import * as path from 'path';
import * as fsp from './fsp';

function joinWith(dir: string): (s: string) => string {
  return (file) => {
    return path.join(dir, file);
  };
}

export class File {
  private readonly dir: string;
  private readonly pathname: string;

  constructor(pathname: string) {
    this.dir = process.cwd();
    this.pathname = pathname;
  }

  public isDirectorySync(): boolean {
    return this.getStatsSync().isDirectory();
  }

  public isSocketSync(): boolean {
    return this.getStatsSync().isSocket();
  }

  public isFileSync(): boolean {
    return this.getStatsSync().isFile();
  }

  public async isDirectory(): Promise<boolean> {
    return this.checkAsyncStats('isDirectory');
  }

  public async isSocket(): Promise<boolean> {
    return this.checkAsyncStats('isSocket');
  }

  public async isFile(): Promise<boolean> {
    return this.checkAsyncStats('isFile');
  }

  public isHiddenSync(): boolean {
    if (!this.isDirectorySync()) {
      return this.isHiddenFile();
    }
    return this.isHiddenDirectory();
  }

  public async isHidden(): Promise<boolean> {
    if (!await this.isDirectory()) {
      return this.isHiddenFile();
    }
    return this.isHiddenDirectory();
  }

  public getListSync(): string[] {
    if (this.isDirectorySync()) {
      return readdirSync(this.pathname)
        .map((file) => {
          return path.join(this.pathname, file);
        });
    }
    return undefined;
  }

  public async getList(glob?: string): Promise<string[]> {
    const files = await this.getFiles(glob);
    if (files.length > 0) {
      return files.map(pathname => pathname.getName());
    }
    return [];
  }

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

  public getFilesSync(glob?: string): File[] {
    if (this.isDirectorySync()) {
      const files = this.getListSync()
        .map((pathname) => {
          return new File(pathname);
        });

      if (glob) { return files.filter(file => file.isMatch(glob)); }

      return files;
    }
    return undefined;
  }

  public getDepthSync(): number {
    if (!this.isDirectorySync()) {
      return this.depth(path.dirname(this.pathname));
    }
    return this.depth(this.pathname);
  }

  public getName(): string {
    return this.pathname;
  }

  public getAbsolutePath(): string {
    if (path.isAbsolute(this.pathname)) {
      return this.pathname;
    }
    return [this.dir, this.pathname].join(path.sep);
  }

  public getCanonicalPath(): string {
    return path.normalize(this.getAbsolutePath());
  }

  public getPathExtension(): string {
    return path.extname(this.pathname).substring(1);
  }

  public lastModifiedSync(): Date {
    return this.getStatsSync().mtime;
  }

  public lastAccessedSync(): Date {
    return this.getStatsSync().atime;
  }

  public lastChangedSync(): Date {
    return this.getStatsSync().ctime;
  }

  public sizeSync(): number {
    return this.getStatsSync().size;
  }

  public async isWritable(): Promise<boolean> {
    return this.access(constants.W_OK);
  }

  public async isReadable(): Promise<boolean> {
    return this.access(constants.R_OK);
  }

  public async isExecutable(): Promise<boolean> {
    return this.access(constants.X_OK);
  }

  public async delete(): Promise<void> {
    return fsp.unlink(this.pathname);
  }

  public async exists(): Promise<boolean> {
    return this.access(constants.R_OK);
  }

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
