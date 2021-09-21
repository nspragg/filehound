import {File} from 'file-js';
import {FileEmitter} from './emitter';

const TERMINATE = false;
const CONTINUE = true;

function isDefined(value: any): any {
  return value !== undefined;
}

function atMaxDepth(dir: File, root: File, opts: any): boolean {
  const depth = dir.getDepthSync() - root.getDepthSync();
  return isDefined(opts.maxDepth) && depth > opts.maxDepth;
}

function shouldFilterDirectory(dir: File, root: File, opts: any): boolean {
  return (atMaxDepth(dir, root, opts) || (opts.ignoreDirs && dir.isHiddenSync()));
}

export async function async(root: string, isMatch: any, opts: any): Promise<any> {
  const finder = new FileEmitter(root);

  return new Promise((resolve, reject) => {
    const files = [];
    const directories = [];

    finder.on('file', (file) => {
      if (!opts.directoriesOnly && isMatch(file)) {
        files.push(file.getName());
      }
    });

    finder.on('directory', (dir, skip) => {
      // @ts-ignore
      if (shouldFilterDirectory(dir, new File(root), opts)) {
        return skip();
      }

      if (dir !== root && isMatch(dir)) {
        directories.push(dir.getName());
      }
    });

    finder.on('error', reject);

    finder.on('stop', () => {
      if (opts.directoriesOnly) {
        return resolve(directories);
      }
      resolve(files.sort());
    });

    finder.start();
  });
}

export function sync(dir: string, isMatch: any, opts: any): any {
  const root = new File(dir);
  const files = [];

  walkSync(root, (path) => {
    if (path.isDirectorySync() && shouldFilterDirectory(path, root, opts)) {
      return TERMINATE;
    }

    if (opts.directoriesOnly) {
      if (path !== root && path.isDirectorySync() && isMatch(path)) {
        files.push(path.getName());
      }
    } else if (!path.isDirectorySync() && isMatch(path)) {
      files.push(path.getName());
    }

    return CONTINUE;
  });

  return files;
}

function getDirNames(dir: File): File[] {
  const names = dir.getFilesSync();
  return names.sort();
}

export function walkSync(path: File, fn: any): any {
  if (!path.isDirectorySync()) {
    return fn(path);
  }

  const cont = fn(path);
  if (!cont) { return; }

  const names = getDirNames(path);
  for (const name of names) {
    walkSync(name, fn);
  }
}
