import * as fsp from 'fs/promises';
import {File} from '../file';
import {FileType} from '../filehound';
import {FilePredicate} from '../matchers';
import {ancestorsOf, byName, createPathError, Walk, WalkOptions} from './walk';

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
async function isVisitable(file: File, walk: Walk): Promise<boolean> {
  if (!await file.isSymbolicLink()) {
    return true;
  }
  if (walk.ignoreSymlinks) {
    return false;
  }
  try {
    return !(await file.isDirectory() && await isCyclicLink(file));
  } catch {
    return false;
  }
}

// Entries are visited concurrently, then their matches are joined in name order.
// concat, not push(...matches): spreading over ~120k elements overflows the stack.
async function visit(file: File, walk: Walk, depth: number): Promise<File[]> {
  const isDirectory = await file.isDirectory();
  if (isDirectory && walk.shouldSkipDirectory(file)) {
    return [];
  }

  const type = isDirectory ? FileType.DIRECTORY : await file.isFile() ? FileType.REGULAR : undefined;
  const matches = walk.isCandidate(file, type) && await walk.matcher.test(file) ? [file] : [];

  if (isDirectory && walk.canDescend(depth)) {
    const children = (await file.getFiles()).sort(byName);
    const childMatches = await Promise.all(children.map(async (child) => {
      return await isVisitable(child, walk) ? visit(child, walk, depth + 1) : [];
    }));
    return matches.concat(childMatches.flat());
  }
  return matches;
}

export async function walkAsync(dir: string, matcher: FilePredicate, opts: WalkOptions): Promise<File[]> {
  const root = new File(dir);
  try {
    await root.getStats();
  } catch {
    throw createPathError(dir);
  }

  return visit(root, new Walk(root, matcher, opts), 0);
}
