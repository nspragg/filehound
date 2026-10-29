import * as fs from 'fs';
import {File} from '../file';
import {FilePredicate} from '../matchers';
import {ancestorsOf, byName, createPathError, Walk, WalkOptions} from './walk';

// A linked directory that resolves to one of its own ancestors would be walked forever
function isCyclicLink(link: File): boolean {
  const target = fs.realpathSync(link.getName());
  return ancestorsOf(link).some(ancestor => fs.realpathSync(ancestor) === target);
}

// Broken links are skipped, as are all links when ignoreSymlinks is set
function isVisitable(file: File, walk: Walk): boolean {
  if (!file.isSymbolicLinkSync()) {
    return true;
  }
  if (walk.ignoreSymlinks) {
    return false;
  }
  try {
    return !(file.isDirectorySync() && isCyclicLink(file));
  } catch {
    return false;
  }
}

function visit(file: File, walk: Walk): File[] {
  const isDirectory = file.isDirectorySync();
  if (isDirectory && walk.shouldSkipDirectory(file)) {
    return [];
  }

  const matches = walk.isCandidate(file, isDirectory) && walk.matcher.testSync(file) ? [file] : [];

  if (isDirectory) {
    const children = file.getFilesSync().sort(byName);
    for (const child of children) {
      if (isVisitable(child, walk)) {
        matches.push(...visit(child, walk));
      }
    }
  }
  return matches;
}

export function walkSync(dir: string, matcher: FilePredicate, opts: WalkOptions): File[] {
  const root = new File(dir);
  try {
    root.getStatsSync();
  } catch {
    throw createPathError(dir);
  }

  return visit(root, new Walk(root, matcher, opts));
}
