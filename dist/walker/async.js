import * as fsp from 'node:fs/promises';
import { File, getChildren, getKnownKind } from '../file.js';
import { Heap } from './heap.js';
import { ancestorsOf, assertDirectory, byName, createPathError, EntryType, typeOf, Walk } from './walk.js';
// How the async walk works, and why
//
// The walk yields matches in batches, in the same order as the sync walk:
// depth first, with siblings in name order. Whoever reads the batches sets the
// pace, so the walk can't run ahead without limit, and stops when they stop.
//
// Walking in order on its own is slow, as each directory would wait on its
// read. So work is started ahead of the walk, within two limits:
//
// - WINDOW: within a directory, the siblings after the one being walked are
//   visited early, starting their stats, predicates and reads.
// - READ_AHEAD: across the tree, directories further on are read early.
//
// Directories are read ahead in the order the walk will reach them, using
// each one's Position and a heap. This order matters, and simpler orders were
// measured and found slow. Node queues reads, so a read the walk needs now
// waits behind every read started before it. Reading ahead among siblings only
// lost the concurrency of reading the tree at once (about 30% slower than
// reading it all, unbounded). Reading ahead in the order reads finished was
// worse: the walk's reads waited behind reads for far-off directories, and it
// was only fast once READ_AHEAD exceeded the number of directories in the tree.
// In walk order, a READ_AHEAD of 32 is enough to match unbounded reading.
//
// So before changing the order of reads, measure it with `npm run bench`, on
// trees both deep and wide.
//
// Work started ahead can fail, or be abandoned, before the walk reaches it.
// prefetch() stops those failures being reported as unhandled, and an aborted
// walk starts no new reads.
// How many siblings are visited ahead of the one being walked. Visiting starts
// the I/O an entry needs: a directory's read, a link's stat or a predicate's.
// Each level of the walk has its own window, so the work in flight is bounded
// by this times the depth.
const WINDOW = 64;
// How many more directories can be read ahead of the walk, beyond those in
// its windows, and not yet walked
const READ_AHEAD = 64;
// Work started ahead of the walk may fail before the walk reaches it, and
// later awaits still see the failure. Until then, Node would otherwise report
// it as unhandled.
function prefetch(pending) {
    pending.catch(() => { });
    return pending;
}
// Compared index by index, positions give walk order: depth first, in name order
function precedes(a, b) {
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a[i] !== b[i]) {
            return a[i] < b[i];
        }
    }
    return a.length < b.length;
}
// Reading directories is most of the work of a walk, so they are read ahead
// of it, in the order the walk will reach them. Reads are queued, so one read
// out of order would hold up the walk behind the rest.
class AsyncWalk extends Walk {
    #signal;
    // Read or being read, and not yet taken by the walk
    #reads = new Map();
    // Found but not yet read
    #found = new Heap((a, b) => precedes(a.position, b.position));
    // Of directories, and links that may be, for when the walk reads them
    #positions = new WeakMap();
    #taken = new WeakSet();
    constructor(matcher, opts) {
        super(matcher, opts);
        this.#signal = opts.signal;
    }
    // Rejects as soon as the walk is aborted, rather than when the work is done,
    // which for a slow predicate could be a long wait
    abortable(pending) {
        const signal = this.#signal;
        if (!signal) {
            return pending;
        }
        signal.throwIfAborted();
        return new Promise((resolve, reject) => {
            const abort = () => reject(signal.reason);
            signal.addEventListener('abort', abort, { once: true });
            pending.then((value) => {
                signal.removeEventListener('abort', abort);
                resolve(value);
            }, (error) => {
                signal.removeEventListener('abort', abort);
                reject(error);
            });
        });
    }
    // For after a yield, as whoever reads the walk may have aborted it meanwhile
    throwIfAborted() {
        this.#signal?.throwIfAborted();
    }
    // The directory's children in name order, read ahead if it was reached
    read(dir, depth) {
        this.#taken.add(dir);
        const read = this.#reads.get(dir) ?? this.#start({ dir, depth, position: this.#positions.get(dir) ?? [] });
        this.#reads.delete(dir);
        this.#readAhead();
        return read;
    }
    #start({ dir, depth, position }) {
        return prefetch(getChildren(dir).then((children) => {
            children.sort(byName);
            this.#find(children, depth + 1, position);
            return children;
        }));
    }
    // Links are left to the walk, which needs a stat to know if they're directories
    #find(children, depth, parent) {
        if (!this.canDescend(depth)) {
            return;
        }
        children.forEach((child, i) => {
            const kind = getKnownKind(child);
            if (kind && !kind.isDirectory()) {
                return;
            }
            const position = [...parent, i];
            this.#positions.set(child, position);
            if (kind && !this.shouldSkipDirectory(child)) {
                this.#found.push({ dir: child, depth, position });
            }
        });
        this.#readAhead();
    }
    #readAhead() {
        if (this.#signal?.aborted) {
            return;
        }
        while (this.#reads.size < READ_AHEAD && this.#found.size > 0) {
            const found = this.#found.pop();
            if (!this.#taken.has(found.dir)) {
                this.#reads.set(found.dir, this.#start(found));
            }
        }
    }
}
// A linked directory that resolves to one of its own ancestors would be walked forever
async function isCyclicLink(link) {
    const target = await fsp.realpath(link.getName());
    for (const ancestor of ancestorsOf(link)) {
        if (await fsp.realpath(ancestor) === target) {
            return true;
        }
    }
    return false;
}
// Broken links are skipped, as are all links when ignoreSymlinks is set
async function isVisitableLink(link, walk) {
    if (walk.ignoreSymlinks) {
        return false;
    }
    try {
        return !(await link.isDirectory() && await isCyclicLink(link));
    }
    catch {
        return false;
    }
}
const NOTHING = Object.freeze({});
// Links have no known kind, so need a stat
async function visitUntyped(file, walk, depth) {
    return visitTyped(file, typeOf(await file.getStats()), walk, depth);
}
async function visitLink(link, walk, depth) {
    return await isVisitableLink(link, walk) ? visitUntyped(link, walk, depth) : NOTHING;
}
function visitTyped(file, type, walk, depth) {
    if (type === EntryType.DIRECTORY && walk.shouldSkipDirectory(file)) {
        return NOTHING;
    }
    const children = type === EntryType.DIRECTORY && walk.canDescend(depth) ? walk.read(file, depth) : undefined;
    if (!walk.isCandidate(file, type)) {
        return children ? { children } : NOTHING;
    }
    if (walk.isSyncMatcher) {
        return walk.matcher.testSync(file) ? { match: file, children } : children ? { children } : NOTHING;
    }
    return walk.matcher.test(file).then(isMatch => ({ match: isMatch ? file : undefined, children }));
}
// Children always have a dirent, so only links lack a known kind
function visitChild(child, walk, depth) {
    const kind = getKnownKind(child);
    const visited = kind ? visitTyped(child, typeOf(kind), walk, depth) : visitLink(child, walk, depth);
    return visited instanceof Promise ? prefetch(visited) : visited;
}
// Matches are yielded in batches, in walk order: an entry, then everything
// below it, then its next sibling, with siblings in name order. A batch is
// yielded before walking down, so matches arrive as they are found.
async function* walkChildren(children, walk, depth) {
    const visits = [];
    let started = 0;
    let matches = [];
    for (let next = 0; next < children.length; next++) {
        for (const end = Math.min(next + WINDOW, children.length); started < end; started++) {
            visits[started] = visitChild(children[started], walk, depth);
        }
        const visited = visits[next];
        visits[next] = undefined;
        const visit = visited instanceof Promise ? await walk.abortable(visited) : visited;
        if (visit.match) {
            matches.push(visit.match);
        }
        if (visit.children) {
            if (matches.length > 0) {
                yield matches;
                walk.throwIfAborted();
                matches = [];
            }
            yield* walkChildren(await walk.abortable(visit.children), walk, depth + 1);
        }
    }
    if (matches.length > 0) {
        yield matches;
        walk.throwIfAborted();
    }
}
export async function* walkAsync(dir, matcher, opts) {
    opts.signal?.throwIfAborted();
    const root = new File(dir);
    let stats;
    try {
        stats = await root.getStats();
    }
    catch (error) {
        throw createPathError(dir, error);
    }
    assertDirectory(dir, stats);
    // The root is never a match, only the place to search, so the walk starts at its children
    const walk = new AsyncWalk(matcher, opts);
    yield* walkChildren(await walk.abortable(walk.read(root, 0)), walk, 1);
}
