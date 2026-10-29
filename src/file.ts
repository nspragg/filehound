import {
  constants,
  Dirent,
  lstatSync,
  readdirSync,
  Stats,
  statSync
} from 'fs';
import * as path from 'path';
import * as fsp from 'fs/promises';

type FileKind = Pick<Stats, 'isDirectory' | 'isFile'>;

function matchesName(file: File, globPattern: string): boolean {
  return path.matchesGlob(path.basename(file.getName()), globPattern);
}

export class File {
  readonly #dir: string;
  readonly #pathname: string;
  // Type info from readdir, saving a stat call
  readonly #dirent?: Dirent;
  // The directory a search started from; glob patterns are matched relative to it
  readonly #root?: string;
  // Fetched once, so predicates and results share a single stat call
  #stats?: Stats;

  constructor(pathname: string, dirent?: Dirent, root?: string) {
    this.#dir = process.cwd();
    this.#pathname = pathname;
    this.#dirent = dirent;
    this.#root = root;
  }

  public isDirectorySync(): boolean {
    return this.#getKindSync().isDirectory();
  }

  public isFileSync(): boolean {
    return this.#getKindSync().isFile();
  }

  public async isDirectory(): Promise<boolean> {
    return (await this.#getKind()).isDirectory();
  }

  public async isFile(): Promise<boolean> {
    return (await this.#getKind()).isFile();
  }

  public isSymbolicLinkSync(): boolean {
    return this.#dirent?.isSymbolicLink() ?? lstatSync(this.#pathname).isSymbolicLink();
  }

  public async isSymbolicLink(): Promise<boolean> {
    return this.#dirent?.isSymbolicLink() ?? (await fsp.lstat(this.#pathname)).isSymbolicLink();
  }

  public isHiddenSync(): boolean {
    if (!this.isDirectorySync()) {
      return this.#isHiddenFile();
    }
    return this.#isHiddenDirectory();
  }

  public async isHidden(): Promise<boolean> {
    if (!await this.isDirectory()) {
      return this.#isHiddenFile();
    }
    return this.#isHiddenDirectory();
  }

  public getListSync(): string[] {
    if (this.isDirectorySync()) {
      return readdirSync(this.#pathname)
        .map((file) => {
          return path.join(this.#pathname, file);
        });
    }
    return [];
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

    const entries = await fsp.readdir(this.#pathname, {withFileTypes: true});
    const prefix = this.#childPrefix();
    const results = entries.map(entry => this.#child(prefix, entry));

    if (results.length === 0) { return []; }
    if (glob) { return results.filter(file => matchesName(file, glob)); }

    return results;
  }

  public getFilesSync(glob?: string): File[] {
    if (this.isDirectorySync()) {
      const prefix = this.#childPrefix();
      const files = readdirSync(this.#pathname, {withFileTypes: true})
        .map(entry => this.#child(prefix, entry));

      if (glob) { return files.filter(file => matchesName(file, glob)); }

      return files;
    }
    return [];
  }

  public getName(): string {
    return this.#pathname;
  }

  public getAbsolutePath(): string {
    return path.resolve(this.#dir, this.#pathname);
  }

  public getCanonicalPath(): string {
    return path.normalize(this.getAbsolutePath());
  }

  // Relative to the search root, or the working directory like fs.glob
  public getRelativePath(): string {
    return path.relative(this.#root ?? this.#dir, this.#pathname);
  }

  public getPathExtension(): string {
    return path.extname(this.#pathname).substring(1);
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

  public async lastModified(): Promise<Date> {
    return (await this.getStats()).mtime;
  }

  public async lastAccessed(): Promise<Date> {
    return (await this.getStats()).atime;
  }

  public async lastChanged(): Promise<Date> {
    return (await this.getStats()).ctime;
  }

  public async size(): Promise<number> {
    return (await this.getStats()).size;
  }

  public getStatsSync(): Stats {
    this.#stats ??= statSync(this.#pathname);
    return this.#stats;
  }

  public async getStats(): Promise<Stats> {
    this.#stats ??= await fsp.stat(this.#pathname);
    return this.#stats;
  }

  public async isWritable(): Promise<boolean> {
    return this.#access(constants.W_OK);
  }

  public async isReadable(): Promise<boolean> {
    return this.#access(constants.R_OK);
  }

  public async isExecutable(): Promise<boolean> {
    return this.#access(constants.X_OK);
  }

  public async delete(): Promise<void> {
    return fsp.unlink(this.#pathname);
  }

  public async exists(): Promise<boolean> {
    return this.#access(constants.R_OK);
  }

  public isMatch(globPattern: string): boolean {
    return path.matchesGlob(this.getRelativePath(), globPattern);
  }

  // path.join is the costliest step of a walk, so it runs once per directory
  // rather than once per entry. Entry names never contain a separator, so
  // prefix + name is exactly what path.join would give.
  #childPrefix(): string {
    return path.join(this.#pathname, '_').slice(0, -1);
  }

  #child(prefix: string, entry: Dirent): File {
    return new File(prefix + entry.name, entry, this.#root ?? this.#pathname);
  }

  // Symlinks are left to stat so their targets are reported
  #getKnownKind(): FileKind | undefined {
    return this.#dirent?.isSymbolicLink() ? undefined : this.#dirent;
  }

  #getKindSync(): FileKind {
    return this.#getKnownKind() ?? this.getStatsSync();
  }

  async #getKind(): Promise<FileKind> {
    return this.#getKnownKind() ?? this.getStats();
  }

  #isHiddenFile(): boolean {
    return (/^\./).test(path.basename(this.#pathname));
  }

  // Normalising first means either separator is handled on Windows
  #isHiddenDirectory(): boolean {
    return path.normalize(this.#pathname)
      .split(path.sep)
      .some(segment => segment.startsWith('.') && segment !== '.' && segment !== '..');
  }

  async #access(permission: number): Promise<boolean> {
    try {
      await fsp.access(this.#pathname, permission);
    } catch {
      return false;
    }
    return true;
  }
}
