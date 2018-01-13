import { File } from 'file-js';

function isDefined(value: any): any {
  return value !== undefined;
}

function flatten(a: File[], b: File[]): File[] {
  return a.concat(b);
}

export class SyncWalker {
  private root: File;
  private tracked: File[];
  private maxDepth: number;
  private directoriesOnly: boolean;
  private ignoreDirs: boolean;

  constructor(root: File, dirsOnly?, ignoreDirs?, maxDepth?) {
    this.root = root;
    this.tracked = [];
    this.directoriesOnly = dirsOnly;
    this.ignoreDirs = ignoreDirs;
    this.maxDepth = maxDepth;
  }

  private atMaxDepth(dir): boolean {
    const depth = dir.getDepthSync() - this.root.getDepthSync();
    return isDefined(this.maxDepth) && depth > this.maxDepth;
  }

  private shouldFilterDirectory(dir): boolean {
    return (this.atMaxDepth(dir) || (this.ignoreDirs && dir.isHiddenSync()));
  }

  private search(path: File, filter: (args: any) => boolean): File[] {
    if (this.shouldFilterDirectory(path)) {
      return [];
    }

    return path.getFilesSync()
      .map((file: File) => {
        if (file.isDirectorySync()) {
          if (!this.shouldFilterDirectory(file)) {
            this.tracked.push(file);
          }
          return this.search(file, filter);
        }
        return file;
      })
      .reduce(flatten, [])
      .filter(filter);
  }

  public walk(filter: (args: any) => boolean): File[] {
    this.tracked = [];
    const files = this.search(this.root, filter);
    if (this.directoriesOnly) {
      return this.tracked.filter(filter);
    }
    return files;
  }
}
