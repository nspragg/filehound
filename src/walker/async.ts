import * as fsp from 'node:fs/promises';
import {File} from '../file.js';
import type {FilePredicate} from '../matchers.js';
import {ancestorsOf, byName, createPathError, EntryType, typeOf, Walk, type WalkOptions} from './walk.js';

// A linked directory that resolves to one of its own ancestors would be walked forever
async function isCyclicLink(link: File): Promise<boolean> {
  const target = await fsp.realpath(link.getName());
  for (const ancestor of ancestorsOf(link)) {
    if (await fsp.realpath(ancestor) === target) {
      return true;
    }
  }
  return false;
}

// Broken links are skipped, as are all links when ignoreSymlinks is set
async function isVisitableLink(link: File, walk: Walk): Promise<boolean> {
  if (walk.ignoreSymlinks) {
    return false;
  }
  try {
    return !(await link.isDirectory() && await isCyclicLink(link));
  } catch {
    return false;
  }
}

// A promise per entry is the main cost of an async walk, so one is only made
// when needed: for a directory to read, a link or root to stat, or a matcher that
// needs I/O. Anything else, such as a file typed by readdir and matched by
// extension, is visited synchronously.
type Visited = File[] | Promise<File[]>;

// The root and links have no known kind, so need a stat
async function visitUntyped(file: File, walk: Walk, depth: number): Promise<File[]> {
  return visitTyped(file, typeOf(await file.getStats()), walk, depth);
}

async function visitLink(link: File, walk: Walk, depth: number): Promise<File[]> {
  return await isVisitableLink(link, walk) ? visitUntyped(link, walk, depth) : [];
}

function visitTyped(file: File, type: EntryType, walk: Walk, depth: number): Visited {
  if (type === EntryType.DIRECTORY && walk.shouldSkipDirectory(file)) {
    return [];
  }
  if (!walk.isCandidate(file, type)) {
    return descend(file, type, walk, depth, []);
  }
  if (walk.isSyncMatcher) {
    return descend(file, type, walk, depth, walk.matcher.testSync(file) ? [file] : []);
  }
  return walk.matcher.test(file).then(isMatch => descend(file, type, walk, depth, isMatch ? [file] : []));
}

function descend(file: File, type: EntryType, walk: Walk, depth: number, matches: File[]): Visited {
  return type === EntryType.DIRECTORY && walk.canDescend(depth) ? visitChildren(file, walk, depth, matches) : matches;
}

// Children are visited concurrently, then their matches are joined in name order.
// concat, not push(...matches): spreading over ~120k elements overflows the stack.
async function visitChildren(dir: File, walk: Walk, depth: number, matches: File[]): Promise<File[]> {
  const children = (await dir.getFiles()).sort(byName);
  // Children always have a dirent, so only links lack a known kind
  const visited = children.map((child) => {
    const kind = child.getKnownKind();
    return kind ? visitTyped(child, typeOf(kind), walk, depth + 1) : visitLink(child, walk, depth + 1);
  });

  const pending = visited.filter(result => result instanceof Promise);
  if (pending.length === 0) {
    return matches.concat((visited as File[][]).flat());
  }
  const settled = await Promise.all(pending);
  let next = 0;
  return matches.concat(visited.flatMap(result => result instanceof Promise ? settled[next++] : result));
}

export async function walkAsync(dir: string, matcher: FilePredicate, opts: WalkOptions): Promise<File[]> {
  const root = new File(dir);
  try {
    await root.getStats();
  } catch (error) {
    throw createPathError(dir, error);
  }

  return visitUntyped(root, new Walk(root, matcher, opts), 0);
}
