import {dirname, resolve} from 'path';
import {File} from '../file';
import {FileType} from '../filehound';
import {FilePredicate} from '../matchers';

export type WalkOptions = {
    maxDepth?: number;
    ignoreHiddenFiles?: boolean;
    ignoreHiddenDirectories?: boolean;
    ignoreSymlinks?: boolean;
    fileTypes: FileType[];
};

export function createPathError(name: string): Error {
  return new Error(`'${name}' is not a valid path`);
}

// State shared by a walk. The async and sync walks (async.ts and sync.ts) share
// everything except the calls that touch the file system, and both return
// matches in name order.
export class Walk {
  readonly matcher: FilePredicate;
  private readonly root: File;
  private readonly rootDepth: number;
  private readonly opts: WalkOptions;

  constructor(root: File, matcher: FilePredicate, opts: WalkOptions) {
    this.root = root;
    this.rootDepth = root.getDepthSync();
    this.matcher = matcher;
    this.opts = opts;
  }

  get ignoreSymlinks(): boolean {
    return this.opts.ignoreSymlinks;
  }

  isCandidate(file: File, isDirectory: boolean): boolean {
    if (isDirectory) {
      return file !== this.root && this.typeEnabled(FileType.DIRECTORY);
    }
    return this.typeEnabled(FileType.REGULAR) && !(this.opts.ignoreHiddenFiles && file.isHiddenSync());
  }

  shouldSkipDirectory(dir: File): boolean {
    if (dir === this.root) {
      return false;
    }
    const atMaxDepth = this.opts.maxDepth !== undefined && dir.getDepthSync() - this.rootDepth > this.opts.maxDepth;
    return atMaxDepth || (this.opts.ignoreHiddenDirectories && dir.isHiddenSync());
  }

  private typeEnabled(type: FileType): boolean {
    return this.opts.fileTypes.includes(type);
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
