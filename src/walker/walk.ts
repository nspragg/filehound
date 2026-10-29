import {dirname, resolve} from 'node:path';
import type {File} from '../file.js';
import {FileType} from '../filehound.js';
import type {FilePredicate} from '../matchers.js';

export type WalkOptions = {
    maxDepth?: number;
    ignoreHiddenFiles: boolean;
    ignoreHiddenDirectories: boolean;
    ignoreSymlinks: boolean;
    fileTypes: FileType[];
};

export function createPathError(name: string, cause: unknown): Error {
  return new Error(`'${name}' is not a valid path`, {cause});
}

// State shared by a walk. The async and sync walks (async.ts and sync.ts) share
// everything except the calls that touch the file system, and both return
// matches in name order.
export class Walk {
  readonly matcher: FilePredicate;
  readonly #root: File;
  readonly #opts: WalkOptions;

  constructor(root: File, matcher: FilePredicate, opts: WalkOptions) {
    this.#root = root;
    this.matcher = matcher;
    this.#opts = opts;
  }

  get ignoreSymlinks(): boolean {
    return this.#opts.ignoreSymlinks;
  }

  // type is undefined for entries that are neither, such as sockets and FIFOs
  isCandidate(file: File, type?: FileType): boolean {
    if (type === FileType.DIRECTORY) {
      return file !== this.#root && this.#typeEnabled(FileType.DIRECTORY);
    }
    if (type === FileType.REGULAR) {
      return this.#typeEnabled(FileType.REGULAR) && !(this.#opts.ignoreHiddenFiles && file.isHiddenSync());
    }
    return false;
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
