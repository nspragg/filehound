import { File } from 'file-js';

function isDefined(value: any): any {
  return value !== undefined;
}

function flatten(a: File[], b: File[]): File[] {
  return a.concat(b);
}

export class AsyncWalker {
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

  private async search(path: File, filter: (args: any) => boolean): Promise<File[]> {
    if (this.shouldFilterDirectory(path)) {
      return [];
    }

    return path.getFiles()
      .map(async (file: File) => {
        if (await file.isDirectory()) {
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

  public async walk(filter: (args: any) => boolean): Promise<File[]> {
    this.tracked = [];
    const files = await this.search(this.root, filter);
    if (this.directoriesOnly) {
      return this.tracked.filter(filter);
    }
    return files;
  }
}
