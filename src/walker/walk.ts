import * as fs from 'fs';
import {dirname, resolve} from 'path';
import {File} from '../file';
import {FileType} from '../filehound';
import {FilePredicate} from '../matchers';
import {EntryFilter, FileEmitter} from './emitter';

const TERMINATE = false;
const CONTINUE = true;

function atMaxDepth(dir: File, root: File, opts: WalkOptions): boolean {
  const depth = dir.getDepthSync() - root.getDepthSync();
  return opts.maxDepth !== undefined && depth > opts.maxDepth;
}

function shouldFilterDirectory(dir: File, root: File, opts: WalkOptions): boolean {
  return (atMaxDepth(dir, root, opts) || (opts.ignoreHiddenDirectories && dir.isHiddenSync()));
}

// A linked directory that resolves to one of its own ancestors would be walked forever
function isCyclicLink(link: File): boolean {
  const target = fs.realpathSync(link.getName());
  let ancestor = dirname(resolve(link.getName()));
  while (true) {
    if (fs.realpathSync(ancestor) === target) {
      return true;
    }
    const parent = dirname(ancestor);
    if (parent === ancestor) {
      return false;
    }
    ancestor = parent;
  }
}

// Broken links are skipped, as are all links when ignoreSymlinks is set
function isVisitable(file: File, opts: WalkOptions): boolean {
  if (!file.isSymbolicLinkSync()) {
    return true;
  }
  if (opts.ignoreSymlinks || !fs.existsSync(file.getName())) {
    return false;
  }
  return !(file.isDirectorySync() && isCyclicLink(file));
}

export type WalkOptions = {
    maxDepth?: number;
    ignoreHiddenFiles?: boolean;
    ignoreHiddenDirectories?: boolean;
    ignoreSymlinks?: boolean;
    fileTypes: FileType[];
};

type WalkPredicate = (path: File) => boolean;

export async function async(root: string, isMatch: FilePredicate, opts: WalkOptions): Promise<string[]> {
  const finder = new FileEmitter(root, file => isVisitable(file, opts));
  const rootDir = new File(root);

  return new Promise((_resolve, reject) => {
    const files: string[] = [];
    const directories: string[] = [];

    function fileTypeEnabled(type: FileType): boolean {
      return opts.fileTypes.includes(type);
    }

    finder.on('file', (file) => {
      function shouldSkipFile(): boolean {
        return file.isHiddenSync() && opts.ignoreHiddenFiles;
      }

      function isFileMatch(): boolean {
        return !shouldSkipFile() && isMatch.test(file);
      }

      if (fileTypeEnabled(FileType.REGULAR) && isFileMatch()) {
        files.push(file.getName());
      }
    });

    finder.on('directory', (dir, skip) => {
      if (shouldFilterDirectory(dir, rootDir, opts)) {
        return skip();
      }

      function isDirectoryMatch(): boolean {
        return dir !== root && isMatch.test(dir);
      }

      if (fileTypeEnabled(FileType.DIRECTORY) && isDirectoryMatch()) {
        directories.push(dir.getName());
      }
    });

    finder.on('error', reject);

    finder.on('stop', () => {
      _resolve(files.concat(directories));
    });

    finder.start().catch(reject);
  });
}

export function sync(dir: string, matcher: FilePredicate, options: WalkOptions): string[] {
  const root = new File(dir);
  const files = [];

  function fileTypeEnabled(type: FileType): boolean {
    return options.fileTypes.includes(type);
  }

  walkSync(root, file => isVisitable(file, options), (path) => {
    if (path.isDirectorySync() && shouldFilterDirectory(path, root, options)) {
      return TERMINATE;
    }

    if (fileTypeEnabled(FileType.REGULAR) && isMatchingFile(path, matcher)) {
      files.push(path.getName());
    }

    if (fileTypeEnabled(FileType.DIRECTORY) && isMatchingDirectory(root, path, matcher)) {
      files.push(path.getName());
    }

    return CONTINUE;
  });

  return files;
}

function getDirNames(dir: File, accept: EntryFilter): File[] {
  const names = dir.getFilesSync().filter(accept);
  return names.sort();
}

export function walkSync(path: File, accept: EntryFilter, fn: WalkPredicate): boolean {
  if (!path.isDirectorySync()) {
    return fn(path);
  }

  const cont = fn(path);
  if (!cont) { return; }

  const names = getDirNames(path, accept);
  for (const name of names) {
    walkSync(name, accept, fn);
  }
}

function isMatchingDirectory(root: File, path: File, isMatch: FilePredicate): boolean {
  return path !== root && path.isDirectorySync() && isMatch.test(path);
}

function isMatchingFile(path: File, isMatch: FilePredicate): boolean {
  return !path.isDirectorySync() && isMatch.test(path);
}
