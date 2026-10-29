import {isDate, isNumber} from 'unit-compare';
import {from} from './arrays';
import {File} from './file';
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
  test(file: File): Promise<boolean>;

  /**
   * Synchronously tests whether a file satisfies this predicate. Used by
   * {@link FileHound.findSync}.
   *
   * @param file - the file to test
   * @returns true if the file matches
   * @throws `TypeError`
   * Thrown if the predicate can only be tested asynchronously.
   */
  testSync(file: File): boolean;
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

  async test(file: File): Promise<boolean> {
    return this.testSync(file);
  }

  abstract testSync(file: File): boolean;
}

export class And extends AbstractFilePredicate {
  private readonly left: FilePredicate;
  private readonly right: FilePredicate;

  constructor(left: FilePredicate, right: FilePredicate) {
    super();
    this.left = left;
    this.right = right;
  }

  async test(file: File): Promise<boolean> {
    return await this.left.test(file) && this.right.test(file);
  }

  testSync(file: File): boolean {
    return this.left.testSync(file) && this.right.testSync(file);
  }
}

export class Not extends AbstractFilePredicate {
  private readonly filePredicate: FilePredicate;

  constructor(filePredicate: FilePredicate) {
    super();
    this.filePredicate = filePredicate;
  }

  async test(file: File): Promise<boolean> {
    return !await this.filePredicate.test(file);
  }

  testSync(file: File): boolean {
    return !this.filePredicate.testSync(file);
  }
}

export class Or extends AbstractFilePredicate {
  private readonly left: FilePredicate;
  private readonly right: FilePredicate;

  constructor(left: FilePredicate, right: FilePredicate) {
    super();
    this.left = left;
    this.right = right;
  }

  async test(file: File): Promise<boolean> {
    return await this.left.test(file) || this.right.test(file);
  }

  testSync(file: File): boolean {
    return this.left.testSync(file) || this.right.testSync(file);
  }
}

export class Extension extends AbstractFilePredicate {
  private readonly extensions: string[];

  constructor(extensions: string[]) {
    super();
    this.extensions = extensions;
  }

  testSync(file: File): boolean {
    return this.extensions.includes(file.getPathExtension());
  }
}

export class Glob extends AbstractFilePredicate {
  private readonly globPattern: string;

  constructor(globPattern: string) {
    super();
    this.globPattern = globPattern;
  }

  testSync(file: File): boolean {
    return file.isMatch(this.globPattern);
  }
}
export class TextMatch extends AbstractFilePredicate {
  private readonly pattern: string;
  private readonly flags: string;

  constructor(pattern: string, flags?: string) {
    super();
    this.pattern = pattern;
    this.flags = flags;
  }

  testSync(file: File): boolean {
    return new RegExp(this.pattern, this.flags).test(file.getName());
  }
}

export class CustomFilter extends AbstractFilePredicate {
  private readonly fn: (path: File) => boolean | Promise<boolean>;

  constructor(fn: (path: File) => boolean | Promise<boolean>) {
    super();
    this.fn = fn;
  }

  async test(file: File): Promise<boolean> {
    return this.fn(file);
  }

  testSync(_file: File): boolean {
    throw new TypeError('applyFilter() filters can only be used with find(). Use applyFilterSync() with findSync()');
  }
}

export class CustomFilterSync extends AbstractFilePredicate {
  private readonly fn: (path: File) => boolean;

  constructor(fn: (path: File) => boolean) {
    super();
    this.fn = fn;
  }

  testSync(file: File): boolean {
    return this.fn(file);
  }
}

export class Size extends AbstractFilePredicate {
  private readonly size: string | number;

  constructor(sizeExpression: string | number) {
    super();
    this.size = sizeExpression;
  }

  async test(file: File): Promise<boolean> {
    return isNumber(await file.size()).assert(this.size);
  }

  testSync(file: File): boolean {
    return isNumber(file.sizeSync()).assert(this.size);
  }
}

export class Modified extends AbstractFilePredicate {
  private readonly days: string | number;

  constructor(days: string | number) {
    super();
    this.days = days;
  }

  async test(file: File): Promise<boolean> {
    return isDate(await file.lastModified()).assert(this.days);
  }

  testSync(file: File): boolean {
    return isDate(file.lastModifiedSync()).assert(this.days);
  }
}

export class Accessed extends AbstractFilePredicate {
  private readonly days: string | number;

  constructor(days: string | number) {
    super();
    this.days = days;
  }

  async test(file: File): Promise<boolean> {
    return isDate(await file.lastAccessed()).assert(this.days);
  }

  testSync(file: File): boolean {
    return isDate(file.lastAccessedSync()).assert(this.days);
  }
}

export class Changed extends AbstractFilePredicate {
  private readonly days: string | number;

  constructor(days: string | number) {
    super();
    this.days = days;
  }

  async test(file: File): Promise<boolean> {
    return isDate(await file.lastChanged()).assert(this.days);
  }

  testSync(file: File): boolean {
    return isDate(file.lastChangedSync()).assert(this.days);
  }
}

export class MatchAll extends AbstractFilePredicate {
  testSync(_file: File): boolean {
    return true;
  }
}

export class Socket extends AbstractFilePredicate {
  async test(file: File): Promise<boolean> {
    return file.isSocket();
  }

  testSync(file: File): boolean {
    return file.isSocketSync();
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

/**
 * Matches files by size. Accepts an exact number of bytes or a comparison
 * expression with optional units, e.g. '>10k' or '<=1mb'.
 *
 * @param s - the size, or size expression, to match
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(size('>1mb'));
 * ```
 */
export function size(s:  number | string): FilePredicate {
  return new Size(s);
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
 * Matches socket files
 *
 * @returns the predicate
 */
export function socket(): FilePredicate {
  return new Socket();
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
export function applyFilter(fn: (path: File) => boolean | Promise<boolean>): FilePredicate {
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
export function applyFilterSync(fn: (path: File) => boolean): FilePredicate {
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
 * Matches files by last modified time. Accepts a number of days or a
 * comparison expression with optional units, e.g. '<10 days'.
 *
 * @param days - the age, or age expression, to match
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(modified('<2 days'));
 * ```
 */
export function modified(days: number | string): FilePredicate {
  return new Modified(days);
}

/**
 * Matches files by last accessed time. Accepts a number of days or a
 * comparison expression with optional units, e.g. '<10 days'.
 *
 * @param days - the age, or age expression, to match
 * @returns the predicate
 */
export function accessed(days: number | string): FilePredicate {
  return new Accessed(days);
}

/**
 * Matches files by last changed (status change) time. Accepts a number of
 * days or a comparison expression with optional units, e.g. '<10 days'.
 *
 * @param days - the age, or age expression, to match
 * @returns the predicate
 */
export function changed(days: number | string): FilePredicate {
  return new Changed(days);
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
