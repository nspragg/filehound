import { parseAge, parseSize } from 'unit-compare';
import { from } from './arrays.js';
// Brands predicates that test a file without I/O, so find() can call testSync
// and save a promise per file. The symbol is not exported from the package, so
// any other predicate is assumed to need I/O and is tested with test().
const sync = Symbol('SyncFilePredicate');
export function isSyncPredicate(predicate) {
    return predicate[sync] === true;
}
// Predicates that need no I/O only implement testSync
export class AbstractFilePredicate {
    or(f) {
        return new Or(this, f);
    }
    and(f) {
        return new And(this, f);
    }
    not() {
        return new Not(this);
    }
    async test(file) {
        return this.testSync(file);
    }
}
export class And extends AbstractFilePredicate {
    #left;
    #right;
    constructor(left, right) {
        super();
        this.#left = left;
        this.#right = right;
    }
    get [sync]() {
        return isSyncPredicate(this.#left) && isSyncPredicate(this.#right);
    }
    async test(file) {
        return await this.#left.test(file) && this.#right.test(file);
    }
    testSync(file) {
        return this.#left.testSync(file) && this.#right.testSync(file);
    }
}
export class Not extends AbstractFilePredicate {
    #filePredicate;
    constructor(filePredicate) {
        super();
        this.#filePredicate = filePredicate;
    }
    get [sync]() {
        return isSyncPredicate(this.#filePredicate);
    }
    async test(file) {
        return !await this.#filePredicate.test(file);
    }
    testSync(file) {
        return !this.#filePredicate.testSync(file);
    }
}
export class Or extends AbstractFilePredicate {
    #left;
    #right;
    constructor(left, right) {
        super();
        this.#left = left;
        this.#right = right;
    }
    get [sync]() {
        return isSyncPredicate(this.#left) && isSyncPredicate(this.#right);
    }
    async test(file) {
        return await this.#left.test(file) || this.#right.test(file);
    }
    testSync(file) {
        return this.#left.testSync(file) || this.#right.testSync(file);
    }
}
export class Extension extends AbstractFilePredicate {
    [sync] = true;
    #extensions;
    constructor(extensions) {
        super();
        this.#extensions = extensions;
    }
    testSync(file) {
        return this.#extensions.includes(file.getPathExtension());
    }
}
export class Glob extends AbstractFilePredicate {
    [sync] = true;
    #globPattern;
    constructor(globPattern) {
        super();
        this.#globPattern = globPattern;
    }
    testSync(file) {
        return file.isMatch(this.#globPattern);
    }
}
export class TextMatch extends AbstractFilePredicate {
    [sync] = true;
    #pattern;
    #flags;
    constructor(pattern, flags) {
        super();
        this.#pattern = pattern;
        this.#flags = flags;
    }
    testSync(file) {
        return new RegExp(this.#pattern, this.#flags).test(file.getName());
    }
}
export class CustomFilter extends AbstractFilePredicate {
    #fn;
    constructor(fn) {
        super();
        this.#fn = fn;
    }
    async test(file) {
        return this.#fn(file);
    }
    testSync(_file) {
        throw new TypeError('applyFilter() filters can only be used with find(). Use applyFilterSync() with findSync()');
    }
}
export class CustomFilterSync extends AbstractFilePredicate {
    [sync] = true;
    #fn;
    constructor(fn) {
        super();
        this.#fn = fn;
    }
    testSync(file) {
        return this.#fn(file);
    }
}
export class Size extends AbstractFilePredicate {
    #isMatch;
    constructor(sizeExpression) {
        super();
        this.#isMatch = parseSize(sizeExpression);
    }
    async test(file) {
        return this.#isMatch(await file.size());
    }
    testSync(file) {
        return this.#isMatch(file.sizeSync());
    }
}
export class Modified extends AbstractFilePredicate {
    #isMatch;
    constructor(expression) {
        super();
        this.#isMatch = parseAge(expression);
    }
    async test(file) {
        return this.#isMatch(await file.lastModified());
    }
    testSync(file) {
        return this.#isMatch(file.lastModifiedSync());
    }
}
export class Accessed extends AbstractFilePredicate {
    #isMatch;
    constructor(expression) {
        super();
        this.#isMatch = parseAge(expression);
    }
    async test(file) {
        return this.#isMatch(await file.lastAccessed());
    }
    testSync(file) {
        return this.#isMatch(file.lastAccessedSync());
    }
}
export class Changed extends AbstractFilePredicate {
    #isMatch;
    constructor(expression) {
        super();
        this.#isMatch = parseAge(expression);
    }
    async test(file) {
        return this.#isMatch(await file.lastChanged());
    }
    testSync(file) {
        return this.#isMatch(file.lastChangedSync());
    }
}
export class MatchAll extends AbstractFilePredicate {
    [sync] = true;
    testSync(_file) {
        return true;
    }
}
export function ext(...args) {
    const extensions = from(args).map(cleanExtension);
    return new Extension(extensions);
}
/**
 * Matches every file
 *
 * @returns the predicate
 */
export function matchAll() {
    return new MatchAll();
}
// The matchers are typed, but JavaScript callers could still pass a number
// where V1 accepted one, so they're told what to use instead
function expressionFor(matcher, expression, example) {
    if (typeof expression !== 'string') {
        throw new TypeError(`${matcher}() takes an expression, such as '${example}'`);
    }
    return expression;
}
/**
 * Matches files by size, using a comparison with optional units, such as
 * `'>10k'` or `'<=1mb'`. The operators are `<`, `<=`, `>`, `>=` and `==`,
 * which is the default, and the units are `b`, `k`, `m`, `g` and `t`, in
 * multiples of 1024. Use {@link sizeEquals} for an exact number of bytes.
 *
 * @param expression - the size expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 * @example
 * ```ts
 * FileHound.create().match(size('>1mb'));
 * ```
 */
export function size(expression) {
    return new Size(expressionFor('size', expression, '>1kb'));
}
/**
 * Matches files of an exact size
 *
 * @param bytes - the size in bytes
 * @returns the predicate
 * @throws `RangeError`
 * Thrown if bytes is negative or not an integer.
 * @example
 * ```ts
 * FileHound.create().match(sizeEquals(1024));
 * ```
 */
export function sizeEquals(bytes) {
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
        throw new RangeError('Size must be a non-negative integer number of bytes');
    }
    return new Size(bytes);
}
/**
 * Matches files with a size of zero bytes
 *
 * @returns the predicate
 */
export function isEmpty() {
    return new Size(0);
}
/**
 * Matches files whose path, relative to the search path, satisfies a glob
 * pattern. Patterns follow Node's `path.matchesGlob` and `fs.glob` rules:
 * `*.json` matches only the top level of the search path, and a leading `**`
 * segment matches at any depth. Wildcards, including `**`, do not match names
 * beginning with a dot.
 *
 * @param globPattern - the glob pattern
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(glob('*.json'));
 * ```
 */
export function glob(globPattern) {
    return new Glob(globPattern);
}
/**
 * Matches files using a custom function, which may be asynchronous. Can only
 * be used with {@link FileHound.find}; use {@link applyFilterSync} with
 * {@link FileHound.findSync}.
 *
 * @param fn - returns, or fulfils with, true for files to include
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(applyFilter(async file => await file.size() > 0));
 * ```
 */
export function applyFilter(fn) {
    return new CustomFilter(fn);
}
/**
 * Matches files using a synchronous custom function. Can be used with both
 * {@link FileHound.find} and {@link FileHound.findSync}.
 *
 * @param fn - returns true for files to include
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(applyFilterSync(file => file.sizeSync() > 0));
 * ```
 */
export function applyFilterSync(fn) {
    return new CustomFilterSync(fn);
}
/**
 * Matches files whose path satisfies a regular expression pattern
 *
 * @param pattern - the regular expression pattern
 * @returns the predicate
 */
export function like(pattern) {
    return new TextMatch(pattern);
}
/**
 * Excludes files whose path satisfies any of the given regular expression patterns
 *
 * @param patterns - one or more regular expression patterns
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(discard('node_modules', '\\.git'));
 * ```
 */
export function discard(...patterns) {
    if (patterns.length === 1) {
        return new TextMatch(patterns[0]).not();
    }
    return patterns
        .map((pattern) => new TextMatch(pattern))
        .reduce((a, b) => a.or(b))
        .not();
}
function cleanExtension(fileExtension) {
    if (fileExtension.startsWith('.')) {
        return fileExtension.slice(1);
    }
    return fileExtension;
}
/**
 * Matches files by when they were last modified, using a comparison of their
 * age with optional units, such as `'<2 days'` or `'>8h'`. The operators are
 * `<`, `<=`, `>` and `=`, which is the default and compares to the second.
 * The units are minutes (`m`, `min`), hours (`h`) and days (`d`), which is
 * the default.
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 * @example
 * ```ts
 * FileHound.create().match(modified('<2 days'));
 * ```
 */
export function modified(expression) {
    return new Modified(expressionFor('modified', expression, '<2 days'));
}
/**
 * Matches files by when they were last accessed, using an age expression as
 * for {@link modified}
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 */
export function accessed(expression) {
    return new Accessed(expressionFor('accessed', expression, '<2 days'));
}
/**
 * Matches files by when their status, such as their permissions, last
 * changed, using an age expression as for {@link modified}
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 */
export function changed(expression) {
    return new Changed(expressionFor('changed', expression, '<2 days'));
}
/**
 * Negates a predicate
 *
 * @param fn - the predicate to negate
 * @returns a predicate that matches when the given one does not
 */
export function not(fn) {
    return new Not(fn);
}
