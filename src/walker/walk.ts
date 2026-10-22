import {File} from '../file';
import {FileEmitter} from './emitter';
import {FileType} from "../filehound";
import {FilePredicate} from "../matchers";

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
  return (atMaxDepth(dir, root, opts) || (opts.ignoreHiddenDirectories && dir.isHiddenSync()));
}

type WalkOptions = {
    maxDepth?: number;
    ignoreHiddenFiles?: boolean;
    ignoreHiddenDirectories?: boolean;
    fileTypes: FileType[];
}

type WalkPredicate = (path: File) => boolean;

export async function async(root: string, isMatch: any, opts: WalkOptions): Promise<string[]> {
  const finder = new FileEmitter(root);

  return new Promise(async (resolve, reject) => {
    const files: string[] = [];
    const directories: string[] = [];

    function fileTypeEnabled(type: FileType) {
      return opts.fileTypes.includes(type);
    }

    finder.on('file', (file) => {
      function shouldSkipFile(file: File) {
        return file.isHiddenSync() && opts.ignoreHiddenFiles;
      }

      function isFileMatch() {
        return !shouldSkipFile(file) && isMatch.test(file);
      }

      if (fileTypeEnabled(FileType.REGULAR) && isFileMatch()) {
        files.push(file.getName());
      }
    });

    finder.on('directory', (dir, skip) => {
      // @ts-ignore
      if (shouldFilterDirectory(dir, new File(root), opts)) {
        return skip();
      }

      function isDirectoryMatch() {
        return dir !== root && isMatch.test(dir);
      }

      if (fileTypeEnabled(FileType.DIRECTORY) && isDirectoryMatch()) {
        directories.push(dir.getName());
      }
    });

    finder.on('error', reject);

    finder.on('stop', () => {
      resolve(files.concat(directories));
    });

    return finder.start();
  });
}

export function sync(dir: string, matcher: FilePredicate, options: WalkOptions): string[] {
  const root = new File(dir);
  const files = [];

  function fileTypeEnabled(type: FileType) {
    return options.fileTypes.includes(type);
  }

  walkSync(root, (path) => {
    if (path.isDirectorySync() && shouldFilterDirectory(path, root, options)) {
      return TERMINATE;
    }


    if (fileTypeEnabled(FileType.DIRECTORY) && isMatchingDirectory(root, path, matcher)) {
      files.push(path.getName());
    }

    if (fileTypeEnabled(FileType.REGULAR) && isMatchingFile(path, matcher)) {
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

export function walkSync(path: File, fn: WalkPredicate): boolean {
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

function isMatchingDirectory(root: File, path: File, isMatch: FilePredicate) {
  return path !== root && path.isDirectorySync() && isMatch.test(path)
}

function isMatchingFile(path: File, isMatch: FilePredicate) {
  return !path.isDirectorySync() && isMatch.test(path)
}

