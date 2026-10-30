import {
  constants,
  type Dirent,
  lstatSync,
  readdirSync,
  type Stats,
  statSync
} from 'node:fs';
import * as path from 'node:path';
import * as fsp from 'node:fs/promises';

export type FileKind = Pick<Stats, 'isDirectory' | 'isFile'>;

/**
 * A read-only view of a file found by a search, as passed to predicates such
 * as {@link applyFilter}. It has no methods that change the file system.
 *
 * @remarks
 * Predicates may be called ahead of the matches being returned, at the same
 * time as each other, and on files that are never returned, for example when
 * a loop over {@link FileHound.iterate} is left early. So a predicate should
 * have no side effects.
 *
 * A file's stats are fetched once, then shared by every predicate and by
 * {@link FileHound.includeFileStats}.
 */
export interface FileView {
  /** The path, as found from the search path */
  getName(): string;
  /** The absolute path */
  getAbsolutePath(): string;
  /** The absolute path, normalised */
  getCanonicalPath(): string;
  /** The path relative to the search path */
  getRelativePath(): string;
  /** The extension, without the leading dot, or an empty string */
  getPathExtension(): string;
  /** Whether the path, relative to the search path, matches a glob pattern */
  isMatch(globPattern: string): boolean;

  /** Whether this is a directory, or a link to one */
  isDirectory(): Promise<boolean>;
  /** Whether this is a directory, or a link to one */
  isDirectorySync(): boolean;
  /** Whether this is a regular file, or a link to one */
  isFile(): Promise<boolean>;
  /** Whether this is a regular file, or a link to one */
  isFileSync(): boolean;
  /** Whether this is a symbolic link */
  isSymbolicLink(): Promise<boolean>;
  /** Whether this is a symbolic link */
  isSymbolicLinkSync(): boolean;
  /** Whether this is hidden: its name, or for a directory any in its path, begins with a dot */
  isHidden(): Promise<boolean>;
  /** Whether this is hidden: its name, or for a directory any in its path, begins with a dot */
  isHiddenSync(): boolean;

  /** The stats, as returned by `fs.stat` */
  getStats(): Promise<Stats>;
  /** The stats, as returned by `fs.statSync` */
  getStatsSync(): Stats;
  /** The size in bytes */
  size(): Promise<number>;
  /** The size in bytes */
  sizeSync(): number;
  /** When the contents were last modified */
  lastModified(): Promise<Date>;
  /** When the contents were last modified */
  lastModifiedSync(): Date;
  /** When the file was last accessed */
  lastAccessed(): Promise<Date>;
  /** When the file was last accessed */
  lastAccessedSync(): Date;
  /** When the file's status, such as its permissions, last changed */
  lastChanged(): Promise<Date>;
  /** When the file's status, such as its permissions, last changed */
  lastChangedSync(): Date;

  /** Whether the file exists and can be read */
  exists(): Promise<boolean>;
  /** Whether the file can be read */
  isReadable(): Promise<boolean>;
  /** Whether the file can be written to */
  isWritable(): Promise<boolean>;
  /** Whether the file can be executed */
  isExecutable(): Promise<boolean>;
}

// What only the walker needs. These are functions rather than methods, so a
// predicate can't reach them. Only code inside File can see its private
// fields, so they're set from its static block.
let knownKindOf: (file: File) => FileKind | undefined;
let childrenOf: (dir: File) => Promise<File[]>;
let childrenOfSync: (dir: File) => File[];

// The kind readdir gave, so needs no I/O. Undefined for links, whose targets
// are reported, and for files made without a dirent, such as a walk's root.
export function getKnownKind(file: File): FileKind | undefined {
  return knownKindOf(file);
}

// A directory's entries, with their kinds from readdir
export function getChildren(dir: File): Promise<File[]> {
  return childrenOf(dir);
}

export function getChildrenSync(dir: File): File[] {
  return childrenOfSync(dir);
}

export class File implements FileView {
  readonly #dir: string;
  readonly #pathname: string;
  // Type info from readdir, saving a stat call
  readonly #dirent?: Dirent;
  // The directory a search started from; glob patterns are matched relative to it
  readonly #root?: string;
  // Fetched once, so predicates and results share a single stat call
  #stats?: Stats;

  static {
    knownKindOf = file => file.#dirent?.isSymbolicLink() ? undefined : file.#dirent;
    childrenOf = async dir => dir.#children();
    childrenOfSync = dir => dir.#childrenSync();
  }

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

  public async exists(): Promise<boolean> {
    return this.#access(constants.R_OK);
  }

  public isMatch(globPattern: string): boolean {
    return path.matchesGlob(this.getRelativePath(), globPattern);
  }

  async #children(): Promise<File[]> {
    if (!await this.isDirectory()) {
      return [];
    }
    const prefix = this.#childPrefix();
    return (await fsp.readdir(this.#pathname, {withFileTypes: true})).map(entry => this.#child(prefix, entry));
  }

  #childrenSync(): File[] {
    if (!this.isDirectorySync()) {
      return [];
    }
    const prefix = this.#childPrefix();
    return readdirSync(this.#pathname, {withFileTypes: true}).map(entry => this.#child(prefix, entry));
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

  #getKindSync(): FileKind {
    return knownKindOf(this) ?? this.getStatsSync();
  }

  async #getKind(): Promise<FileKind> {
    return knownKindOf(this) ?? this.getStats();
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
