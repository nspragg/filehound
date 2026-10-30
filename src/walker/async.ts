import * as fsp from 'node:fs/promises';
import {File} from '../file.js';
import type {FilePredicate} from '../matchers.js';
import {Heap} from './heap.js';
import {ancestorsOf, byName, createPathError, EntryType, typeOf, Walk, type WalkOptions} from './walk.js';

// How many siblings are visited ahead of the one being walked, for those that
// need I/O, such as links. Each level of the walk has its own window, so the
// work in flight is bounded by this times the depth.
const WINDOW = 64;

// How many directories can be read ahead of the walk and not yet walked
const READ_AHEAD = 64;

// Work started ahead of the walk may fail before the walk reaches it, and
// later awaits still see the failure. Until then, Node would otherwise report
// it as unhandled.
function prefetch<T>(pending: Promise<T>): Promise<T> {
  pending.catch(() => {});
  return pending;
}

// Where an entry comes in the walk: the index of each directory on the way to
// it, then its own, among siblings in name order
type Position = number[];

// Compared index by index, positions give walk order: depth first, in name order
function precedes(a: Position, b: Position): boolean {
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] < b[i];
    }
  }
  return a.length < b.length;
}

type Found = {dir: File; depth: number; position: Position};

// Reading directories is most of the work of a walk, so they are read ahead
// of it, in the order the walk will reach them. Reads are queued, so one read
// out of order would hold up the walk behind the rest.
class AsyncWalk extends Walk {
  // Read or being read, and not yet taken by the walk
  readonly #reads = new Map<File, Promise<File[]>>();
  // Found but not yet read
  readonly #found = new Heap<Found>((a, b) => precedes(a.position, b.position));
  // Of directories, and links that may be, for when the walk reads them
  readonly #positions = new WeakMap<File, Position>();
  readonly #taken = new WeakSet<File>();

  // The directory's children in name order, read ahead if it was reached
  read(dir: File, depth: number): Promise<File[]> {
    this.#taken.add(dir);
    const read = this.#reads.get(dir) ?? this.#start({dir, depth, position: this.#positions.get(dir) ?? []});
    this.#reads.delete(dir);
    this.#readAhead();
    return read;
  }

  #start({dir, depth, position}: Found): Promise<File[]> {
    return prefetch(dir.getFiles().then((children) => {
      children.sort(byName);
      this.#find(children, depth + 1, position);
      return children;
    }));
  }

  // Links are left to the walk, which needs a stat to know if they're directories
  #find(children: File[], depth: number, parent: Position): void {
    if (!this.canDescend(depth)) {
      return;
    }
    children.forEach((child, i) => {
      const kind = child.getKnownKind();
      if (kind && !kind.isDirectory()) {
        return;
      }
      const position = [...parent, i];
      this.#positions.set(child, position);
      if (kind && !this.shouldSkipDirectory(child)) {
        this.#found.push({dir: child, depth, position});
      }
    });
    this.#readAhead();
  }

  #readAhead(): void {
    while (this.#reads.size < READ_AHEAD && this.#found.size > 0) {
      const found = this.#found.pop()!;
      if (!this.#taken.has(found.dir)) {
        this.#reads.set(found.dir, this.#start(found));
      }
    }
  }
}

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
async function isVisitableLink(link: File, walk: AsyncWalk): Promise<boolean> {
  if (walk.ignoreSymlinks) {
    return false;
  }
  try {
    return !(await link.isDirectory() && await isCyclicLink(link));
  } catch {
    return false;
  }
}

// An entry's match, if any, and for a directory to walk, its children,
// already being read.
type Visit = {match?: File; children?: Promise<File[]>};

const NOTHING: Visit = Object.freeze({});

// A promise per entry is the main cost of an async walk, so one is only made
// when needed: for a link or root to stat, or a matcher that needs I/O.
// Anything else, such as a file typed by readdir and matched by extension, is
// visited synchronously.
type Visited = Visit | Promise<Visit>;

// The root and links have no known kind, so need a stat
async function visitUntyped(file: File, walk: AsyncWalk, depth: number): Promise<Visit> {
  return visitTyped(file, typeOf(await file.getStats()), walk, depth);
}

async function visitLink(link: File, walk: AsyncWalk, depth: number): Promise<Visit> {
  return await isVisitableLink(link, walk) ? visitUntyped(link, walk, depth) : NOTHING;
}

function visitTyped(file: File, type: EntryType, walk: AsyncWalk, depth: number): Visited {
  if (type === EntryType.DIRECTORY && walk.shouldSkipDirectory(file)) {
    return NOTHING;
  }
  const children = type === EntryType.DIRECTORY && walk.canDescend(depth) ? walk.read(file, depth) : undefined;
  if (!walk.isCandidate(file, type)) {
    return children ? {children} : NOTHING;
  }
  if (walk.isSyncMatcher) {
    return walk.matcher.testSync(file) ? {match: file, children} : children ? {children} : NOTHING;
  }
  return walk.matcher.test(file).then(isMatch => ({match: isMatch ? file : undefined, children}));
}

// Children always have a dirent, so only links lack a known kind
function visitChild(child: File, walk: AsyncWalk, depth: number): Visited {
  const kind = child.getKnownKind();
  const visited = kind ? visitTyped(child, typeOf(kind), walk, depth) : visitLink(child, walk, depth);
  return visited instanceof Promise ? prefetch(visited) : visited;
}

// Matches are yielded in batches, in walk order: an entry, then everything
// below it, then its next sibling, with siblings in name order. A batch is
// yielded before walking down, so matches arrive as they are found.
async function* walkVisit(visit: Visit, walk: AsyncWalk, depth: number): AsyncGenerator<File[]> {
  if (visit.match) {
    yield [visit.match];
  }
  if (visit.children) {
    yield* walkChildren(await visit.children, walk, depth + 1);
  }
}

async function* walkChildren(children: File[], walk: AsyncWalk, depth: number): AsyncGenerator<File[]> {
  const visits: (Visited | undefined)[] = [];
  let started = 0;
  let matches: File[] = [];

  for (let next = 0; next < children.length; next++) {
    for (const end = Math.min(next + WINDOW, children.length); started < end; started++) {
      visits[started] = visitChild(children[started], walk, depth);
    }
    const visited = visits[next]!;
    visits[next] = undefined;
    const visit = visited instanceof Promise ? await visited : visited;

    if (visit.match) {
      matches.push(visit.match);
    }
    if (visit.children) {
      if (matches.length > 0) {
        yield matches;
        matches = [];
      }
      yield* walkChildren(await visit.children, walk, depth + 1);
    }
  }
  if (matches.length > 0) {
    yield matches;
  }
}

export async function* walkAsync(dir: string, matcher: FilePredicate, opts: WalkOptions): AsyncGenerator<File[]> {
  const root = new File(dir);
  try {
    await root.getStats();
  } catch (error) {
    throw createPathError(dir, error);
  }

  const walk = new AsyncWalk(root, matcher, opts);
  yield* walkVisit(await visitUntyped(root, walk, 0), walk, 0);
}
