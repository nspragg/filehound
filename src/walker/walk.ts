import {dirname, resolve} from 'node:path';
import type {File, FileKind} from '../file.js';
import {FileType} from '../filetype.js';
import {type FilePredicate, isSyncPredicate} from '../matchers.js';

export type WalkOptions = {
    maxDepth?: number;
    ignoreHiddenFiles: boolean;
    ignoreHiddenDirectories: boolean;
    ignoreSymlinks: boolean;
    fileTypes: FileType[];
};

// Every entry has one. FileType is the public subset; anything else, such as a
// socket or FIFO, is OTHER and never matched.
export const EntryType = {...FileType, OTHER: 'other'} as const;

export type EntryType = typeof EntryType[keyof typeof EntryType];

export function createPathError(name: string, cause: unknown): Error {
  return new Error(`'${name}' is not a valid path`, {cause});
}

// State shared by a walk. The async and sync walks (async.ts and sync.ts) share
// everything except the calls that touch the file system, and both return
// matches in name order.
export class Walk {
  readonly matcher: FilePredicate;
  // Checked once, as combined predicates work it out from their parts
  readonly isSyncMatcher: boolean;
  readonly #root: File;
  readonly #opts: WalkOptions;

  constructor(root: File, matcher: FilePredicate, opts: WalkOptions) {
    this.#root = root;
    this.matcher = matcher;
    this.isSyncMatcher = isSyncPredicate(matcher);
    this.#opts = opts;
  }

  get ignoreSymlinks(): boolean {
    return this.#opts.ignoreSymlinks;
  }

  isCandidate(file: File, type: EntryType): boolean {
    switch (type) {
      case EntryType.DIRECTORY:
        return file !== this.#root && this.#typeEnabled(type);
      case EntryType.REGULAR:
        return this.#typeEnabled(type) && !(this.#opts.ignoreHiddenFiles && file.isHiddenSync());
      case EntryType.OTHER:
        return false;
    }
  }

  // Hidden directories are neither returned nor walked
  shouldSkipDirectory(dir: File): boolean {
    return dir !== this.#root && this.#opts.ignoreHiddenDirectories && dir.isHiddenSync();
  }

  // depth counts levels below the root, which is 0. A directory beyond
  // maxDepth is still returned, like any other entry at its level, but not walked.
  canDescend(depth: number): boolean {
    return this.#opts.maxDepth === undefined || depth <= this.#opts.maxDepth;
  }

  #typeEnabled(type: FileType): boolean {
    return this.#opts.fileTypes.includes(type);
  }
}

export function typeOf(kind: FileKind): EntryType {
  return kind.isDirectory() ? EntryType.DIRECTORY : kind.isFile() ? EntryType.REGULAR : EntryType.OTHER;
}

export function byName(a: File, b: File): number {
  return a.getName() < b.getName() ? -1 : a.getName() > b.getName() ? 1 : 0;
}

export function ancestorsOf(file: File): string[] {
  const ancestors = [];
  let ancestor = dirname(resolve(file.getName()));
  while (dirname(ancestor) !== ancestor) {
    ancestors.push(ancestor);
    ancestor = dirname(ancestor);
  }
  ancestors.push(ancestor);

  return ancestors;
}
