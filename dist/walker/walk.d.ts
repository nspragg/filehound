import type { File, FileKind } from '../file.js';
import { FileType } from '../filetype.js';
import { type FilePredicate } from '../matchers.js';
export type WalkOptions = {
    maxDepth?: number;
    ignoreHiddenFiles: boolean;
    ignoreHiddenDirectories: boolean;
    ignoreSymlinks: boolean;
    fileTypes: FileType[];
    signal?: AbortSignal;
};
export declare const EntryType: {
    readonly OTHER: "other";
    readonly REGULAR: "regular";
    readonly DIRECTORY: "directory";
};
export type EntryType = typeof EntryType[keyof typeof EntryType];
export declare function createPathError(name: string, cause: unknown): Error;
export declare function assertDirectory(name: string, stats: FileKind): void;
export declare class Walk {
    #private;
    readonly matcher: FilePredicate;
    readonly isSyncMatcher: boolean;
    constructor(matcher: FilePredicate, opts: WalkOptions);
    get ignoreSymlinks(): boolean;
    isCandidate(file: File, type: EntryType): boolean;
    shouldSkipDirectory(dir: File): boolean;
    canDescend(depth: number): boolean;
}
export declare function typeOf(kind: FileKind): EntryType;
export declare function byName(a: File, b: File): number;
export declare function ancestorsOf(file: File): string[];
