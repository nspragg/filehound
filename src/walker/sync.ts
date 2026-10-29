import * as fs from 'node:fs';
import {File} from '../file.js';
import {FileType} from '../filehound.js';
import type {FilePredicate} from '../matchers.js';
import {ancestorsOf, byName, createPathError, Walk, type WalkOptions} from './walk.js';

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

// Entries are visited depth first in name order, adding to a single list of matches
function visit(file: File, walk: Walk, depth: number, matches: File[]): File[] {
  const isDirectory = file.isDirectorySync();
  if (isDirectory && walk.shouldSkipDirectory(file)) {
    return matches;
  }

  const type = isDirectory ? FileType.DIRECTORY : file.isFileSync() ? FileType.REGULAR : undefined;
  if (walk.isCandidate(file, type) && walk.matcher.testSync(file)) {
    matches.push(file);
  }

  if (isDirectory && walk.canDescend(depth)) {
    const children = file.getFilesSync().sort(byName);
    for (const child of children) {
      if (isVisitable(child, walk)) {
        visit(child, walk, depth + 1, matches);
      }
    }
  }
  return matches;
}

export function walkSync(dir: string, matcher: FilePredicate, opts: WalkOptions): File[] {
  const root = new File(dir);
  try {
    root.getStatsSync();
  } catch (error) {
    throw createPathError(dir, error);
  }

  return visit(root, new Walk(root, matcher, opts), 0, []);
}
