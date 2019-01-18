import * as File from 'file-js';
import { walkSync } from './walkSync';
import * as find from 'findit';

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

export async function async(root: string, isMatch, opts): Promise<any> {
  const finder = find(root);

  return new Promise((resolve, reject) => {
    const files = [];

    finder.on('file', (file) => {
      if (opts.directoriesOnly) { return; }
      if (isMatch(File.create(file))) { files.push(file); }
    });

    finder.on('directory', (dir, stat, stop) => {
      if (shouldFilterDirectory(File.create(dir), File.create(root), opts)) {
        return stop();
      }

      if (opts.directoriesOnly) {
        if (dir !== root && isMatch(File.create(dir))) {
          files.push(dir);
        }
      }
    });

    finder.on('error', reject);
    finder.on('end', () => {
      resolve(files.sort());
    });
    finder.on('stop', () => {
      resolve(files.sort());
    });
  });
}

export function sync(dir: string, isMatch, opts) {
  const root = File.create(dir);
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
