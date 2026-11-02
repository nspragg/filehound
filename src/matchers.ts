import {parseAge, parseSize} from 'unit-compare';
import {from} from './arrays.js';
import type {FileView} from './file.js';
import type {AgeFilter, SizeFilter} from 'unit-compare';
/**
 * A composable test applied to each file found during a search
 */
export interface FilePredicate {
  /**
   * Negates this predicate
   *
   * @returns a predicate that matches when this one does not
   */
  not(): FilePredicate;

  /**
   * Combines this predicate with another using logical OR
   *
   * @param predicate - the predicate to combine with
   * @returns a predicate that matches when either predicate matches
   */
  or(predicate: FilePredicate): FilePredicate;

  /**
   * Combines this predicate with another using logical AND
   *
   * @param predicate - the predicate to combine with
   * @returns a predicate that matches when both predicates match
   */
  and(predicate: FilePredicate): FilePredicate;

  /**
   * Asynchronously tests whether a file satisfies this predicate. Used by
   * {@link FileHound.find}.
   *
   * @param file - the file to test
   * @returns a Promise that fulfils with true if the file matches
   */
  test(file: FileView): Promise<boolean>;

  /**
   * Synchronously tests whether a file satisfies this predicate. Used by
   * {@link FileHound.findSync}.
   *
   * @param file - the file to test
   * @returns true if the file matches
   * @throws `TypeError`
   * Thrown if the predicate can only be tested asynchronously.
   */
  testSync(file: FileView): boolean;
}

// Brands predicates that test a file without I/O, so find() can call testSync
// and save a promise per file. The symbol is not exported from the package, so
// any other predicate is assumed to need I/O and is tested with test().
const sync = Symbol('SyncFilePredicate');

export interface SyncFilePredicate extends FilePredicate {
  readonly [sync]: true;
}

export function isSyncPredicate(predicate: FilePredicate): predicate is SyncFilePredicate {
  return (predicate as Partial<SyncFilePredicate>)[sync] === true;
}

// Predicates that need no I/O only implement testSync
export abstract class AbstractFilePredicate implements FilePredicate {
  or(f: FilePredicate): FilePredicate {
    return new Or(this, f);
  }

  and(f: FilePredicate): FilePredicate {
    return new And(this, f);
  }

  not(): FilePredicate {
    return new Not(this);
  }

  async test(file: FileView): Promise<boolean> {
    return this.testSync(file);
  }

  abstract testSync(file: FileView): boolean;
}

export class And extends AbstractFilePredicate {
  readonly #left: FilePredicate;
  readonly #right: FilePredicate;

  constructor(left: FilePredicate, right: FilePredicate) {
    super();
    this.#left = left;
    this.#right = right;
  }

  get [sync](): boolean {
    return isSyncPredicate(this.#left) && isSyncPredicate(this.#right);
  }

  override async test(file: FileView): Promise<boolean> {
    return await this.#left.test(file) && this.#right.test(file);
  }

  testSync(file: FileView): boolean {
    return this.#left.testSync(file) && this.#right.testSync(file);
  }
}

export class Not extends AbstractFilePredicate {
  readonly #filePredicate: FilePredicate;

  constructor(filePredicate: FilePredicate) {
    super();
    this.#filePredicate = filePredicate;
  }

  get [sync](): boolean {
    return isSyncPredicate(this.#filePredicate);
  }

  override async test(file: FileView): Promise<boolean> {
    return !await this.#filePredicate.test(file);
  }

  testSync(file: FileView): boolean {
    return !this.#filePredicate.testSync(file);
  }
}

export class Or extends AbstractFilePredicate {
  readonly #left: FilePredicate;
  readonly #right: FilePredicate;

  constructor(left: FilePredicate, right: FilePredicate) {
    super();
    this.#left = left;
    this.#right = right;
  }

  get [sync](): boolean {
    return isSyncPredicate(this.#left) && isSyncPredicate(this.#right);
  }

  override async test(file: FileView): Promise<boolean> {
    return await this.#left.test(file) || this.#right.test(file);
  }

  testSync(file: FileView): boolean {
    return this.#left.testSync(file) || this.#right.testSync(file);
  }
}

export class Extension extends AbstractFilePredicate {
  readonly [sync] = true;

  readonly #extensions: string[];

  constructor(extensions: string[]) {
    super();
    this.#extensions = extensions;
  }

  testSync(file: FileView): boolean {
    return this.#extensions.includes(file.getPathExtension());
  }
}

export class Glob extends AbstractFilePredicate {
  readonly [sync] = true;

  readonly #globPattern: string;

  constructor(globPattern: string) {
    super();
    this.#globPattern = globPattern;
  }

  testSync(file: FileView): boolean {
    return file.isMatch(this.#globPattern);
  }
}
export class TextMatch extends AbstractFilePredicate {
  readonly [sync] = true;

  readonly #pattern: string;
  readonly #flags?: string;

  constructor(pattern: string, flags?: string) {
    super();
    this.#pattern = pattern;
    this.#flags = flags;
  }

  testSync(file: FileView): boolean {
    return new RegExp(this.#pattern, this.#flags).test(file.getName());
  }
}

export class CustomFilter extends AbstractFilePredicate {
  readonly #fn: (file: FileView) => boolean | Promise<boolean>;

  constructor(fn: (file: FileView) => boolean | Promise<boolean>) {
    super();
    this.#fn = fn;
  }

  override async test(file: FileView): Promise<boolean> {
    return this.#fn(file);
  }

  testSync(_file: FileView): boolean {
    throw new TypeError('applyFilter() filters can only be used with find(). Use applyFilterSync() with findSync()');
  }
}

export class CustomFilterSync extends AbstractFilePredicate {
  readonly [sync] = true;

  readonly #fn: (file: FileView) => boolean;

  constructor(fn: (file: FileView) => boolean) {
    super();
    this.#fn = fn;
  }

  testSync(file: FileView): boolean {
    return this.#fn(file);
  }
}

export class Size extends AbstractFilePredicate {
  readonly #isMatch: SizeFilter;

  constructor(sizeExpression: string | number) {
    super();
    this.#isMatch = parseSize(sizeExpression);
  }

  override async test(file: FileView): Promise<boolean> {
    return this.#isMatch(await file.size());
  }

  testSync(file: FileView): boolean {
    return this.#isMatch(file.sizeSync());
  }
}

export class Modified extends AbstractFilePredicate {
  readonly #isMatch: AgeFilter;

  constructor(expression: string) {
    super();
    this.#isMatch = parseAge(expression);
  }

  override async test(file: FileView): Promise<boolean> {
    return this.#isMatch(await file.lastModified());
  }

  testSync(file: FileView): boolean {
    return this.#isMatch(file.lastModifiedSync());
  }
}

export class Accessed extends AbstractFilePredicate {
  readonly #isMatch: AgeFilter;

  constructor(expression: string) {
    super();
    this.#isMatch = parseAge(expression);
  }

  override async test(file: FileView): Promise<boolean> {
    return this.#isMatch(await file.lastAccessed());
  }

  testSync(file: FileView): boolean {
    return this.#isMatch(file.lastAccessedSync());
  }
}

export class Changed extends AbstractFilePredicate {
  readonly #isMatch: AgeFilter;

  constructor(expression: string) {
    super();
    this.#isMatch = parseAge(expression);
  }

  override async test(file: FileView): Promise<boolean> {
    return this.#isMatch(await file.lastChanged());
  }

  testSync(file: FileView): boolean {
    return this.#isMatch(file.lastChangedSync());
  }
}

export class MatchAll extends AbstractFilePredicate {
  readonly [sync] = true;

  testSync(_file: FileView): boolean {
    return true;
  }
}

/**
 * Matches files with any of the given extensions. A leading dot is optional.
 *
 * @param extensions - one or more extensions
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(ext('json', '.txt'));
 * ```
 */
export function ext(...extensions: string[]): FilePredicate;
/**
 * Matches files with any of the given extensions. A leading dot is optional.
 *
 * @param extensions - an array of extensions
 * @returns the predicate
 */
export function ext(extensions: string[]): FilePredicate;
export function ext(...args: (string | string[])[]): FilePredicate {
  const extensions = from(args).map(cleanExtension);
  return new Extension(extensions);
}

/**
 * Matches every file
 *
 * @returns the predicate
 */
export function matchAll(): FilePredicate {
  return new MatchAll();
}

// The matchers are typed, but JavaScript callers could still pass a number
// where V1 accepted one, so they're told what to use instead
function expressionFor(matcher: string, expression: unknown, example: string): string {
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
export function size(expression: string): FilePredicate {
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
export function sizeEquals(bytes: number): FilePredicate {
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
export function isEmpty(): FilePredicate {
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
export function glob(globPattern: string): FilePredicate {
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
export function applyFilter(fn: (file: FileView) => boolean | Promise<boolean>): FilePredicate {
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
export function applyFilterSync(fn: (file: FileView) => boolean): FilePredicate {
  return new CustomFilterSync(fn);
}

/**
 * Matches files whose path satisfies a regular expression pattern
 *
 * @param pattern - the regular expression pattern
 * @returns the predicate
 */
export function like(pattern: string): FilePredicate {
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
export function discard(...patterns: string[]): FilePredicate {
  if (patterns.length === 1) {
    return new TextMatch(patterns[0]).not();
  }

  return patterns
    .map((pattern): FilePredicate => new TextMatch(pattern))
    .reduce((a, b) => a.or(b))
    .not();
}

function cleanExtension(fileExtension: string): string {
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
export function modified(expression: string): FilePredicate {
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
export function accessed(expression: string): FilePredicate {
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
export function changed(expression: string): FilePredicate {
  return new Changed(expressionFor('changed', expression, '<2 days'));
}

/**
 * Negates a predicate
 *
 * @param fn - the predicate to negate
 * @returns a predicate that matches when the given one does not
 */
export function not(fn: FilePredicate): FilePredicate {
  return new Not(fn);
}
