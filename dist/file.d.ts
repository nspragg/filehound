import { type Dirent, type Stats } from 'node:fs';
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
export declare function getKnownKind(file: File): FileKind | undefined;
export declare function getChildren(dir: File): Promise<File[]>;
export declare function getChildrenSync(dir: File): File[];
export declare class File implements FileView {
    #private;
    constructor(pathname: string, dirent?: Dirent, root?: string);
    isDirectorySync(): boolean;
    isFileSync(): boolean;
    isDirectory(): Promise<boolean>;
    isFile(): Promise<boolean>;
    isSymbolicLinkSync(): boolean;
    isSymbolicLink(): Promise<boolean>;
    isHiddenSync(): boolean;
    isHidden(): Promise<boolean>;
    getName(): string;
    getAbsolutePath(): string;
    getCanonicalPath(): string;
    getRelativePath(): string;
    getPathExtension(): string;
    lastModifiedSync(): Date;
    lastAccessedSync(): Date;
    lastChangedSync(): Date;
    sizeSync(): number;
    lastModified(): Promise<Date>;
    lastAccessed(): Promise<Date>;
    lastChanged(): Promise<Date>;
    size(): Promise<number>;
    getStatsSync(): Stats;
    getStats(): Promise<Stats>;
    isWritable(): Promise<boolean>;
    isReadable(): Promise<boolean>;
    isExecutable(): Promise<boolean>;
    exists(): Promise<boolean>;
    isMatch(globPattern: string): boolean;
}
