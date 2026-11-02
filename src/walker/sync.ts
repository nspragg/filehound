import * as fs from 'node:fs';
import {File, getChildrenSync, getKnownKind} from '../file.js';
import type {FilePredicate} from '../matchers.js';
import {ancestorsOf, assertDirectory, byName, createPathError, EntryType, typeOf, Walk, type WalkOptions} from './walk.js';

// A linked directory that resolves to one of its own ancestors would be walked forever
function isCyclicLink(link: File): boolean {
  const target = fs.realpathSync(link.getName());
  return ancestorsOf(link).some(ancestor => fs.realpathSync(ancestor) === target);
}

// Broken links are skipped, as are all links when ignoreSymlinks is set
function isVisitableLink(link: File, walk: Walk): boolean {
  if (walk.ignoreSymlinks) {
    return false;
  }
  try {
    return !(link.isDirectorySync() && isCyclicLink(link));
  } catch {
    return false;
  }
}

// Links have no known kind, so need a stat
function visitUntyped(file: File, walk: Walk, depth: number, matches: File[]): File[] {
  return visitTyped(file, typeOf(file.getStatsSync()), walk, depth, matches);
}

function visitLink(link: File, walk: Walk, depth: number, matches: File[]): File[] {
  return isVisitableLink(link, walk) ? visitUntyped(link, walk, depth, matches) : matches;
}

// Entries are visited depth first in name order, adding to a single list of matches
function visitTyped(file: File, type: EntryType, walk: Walk, depth: number, matches: File[]): File[] {
  if (type === EntryType.DIRECTORY && walk.shouldSkipDirectory(file)) {
    return matches;
  }

  if (walk.isCandidate(file, type) && walk.matcher.testSync(file)) {
    matches.push(file);
  }

  if (type === EntryType.DIRECTORY && walk.canDescend(depth)) {
    visitChildren(file, walk, depth + 1, matches);
  }
  return matches;
}

// Children always have a dirent, so only links lack a known kind
function visitChildren(dir: File, walk: Walk, depth: number, matches: File[]): File[] {
  for (const child of getChildrenSync(dir).sort(byName)) {
    const kind = getKnownKind(child);
    if (kind) {
      visitTyped(child, typeOf(kind), walk, depth, matches);
    } else {
      visitLink(child, walk, depth, matches);
    }
  }
  return matches;
}

export function walkSync(dir: string, matcher: FilePredicate, opts: WalkOptions): File[] {
  const root = new File(dir);
  let stats;
  try {
    stats = root.getStatsSync();
  } catch (error) {
    throw createPathError(dir, error);
  }
  assertDirectory(dir, stats);

  // The root is never a match, only the place to search, so the walk starts at its children
  return visitChildren(root, new Walk(matcher, opts), 1, []);
}
