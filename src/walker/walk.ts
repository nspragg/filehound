import * as File from 'file-js';
import { walkSync } from './walkSync';
import { walkAsync } from './walkAsync';

const TERMINATE = false;
const CONTINUE = true;

function isDefined(value: any): any {
  return value !== undefined;
}

function atMaxDepth(dir, root, opts): boolean {
  const depth = dir.getDepthSync() - root.getDepthSync();
  return isDefined(opts.maxDepth) && depth > opts.maxDepth;
}

function shouldFilterDirectory(dir, root, opts): boolean {
  return (atMaxDepth(dir, root, opts) || (opts.ignoreDirs && dir.isHiddenSync()));
}

export async function async(dir: string, isMatch, opts): Promise<string[]> {
  const root = File.create(dir);
  const files = [];

  await walkAsync(root, async (path) => {
    if (await path.isDirectory() && shouldFilterDirectory(path, root, opts)) {
      return TERMINATE;
    }
    if (opts.directoriesOnly) {
      if (path !== root && await path.isDirectory() && isMatch(path)) {
        files.push(path.getName());
      }
    } else if (!await path.isDirectory() && isMatch(path)) {
      files.push(path.getName());
    }
    return CONTINUE;
  });

  return files;
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
