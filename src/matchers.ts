import * as _ from 'lodash';
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
   * Tests whether a file satisfies this predicate
   *
   * @param file - the file to test
   * @returns true if the file matches
   */
  test(file: File): boolean;
}
export abstract class AbstractFilePredicate implements FilePredicate {

  abstract test(file: File): boolean;

  or(f: FilePredicate): FilePredicate {
    return new Or(this, f);
  }

  and(f: FilePredicate): FilePredicate {
    return new And(this, f);
  }

  not(): FilePredicate {
    return new Not(this);
  }
}

export class And extends AbstractFilePredicate {
  private readonly left: FilePredicate;
  private readonly right: FilePredicate;

  constructor(left: FilePredicate, right: FilePredicate) {
    super();
    this.left = left;
    this.right = right;
  }

  test(file: File): boolean {
    return this.left.test(file) && this.right.test(file);
  }
}

export class Not extends AbstractFilePredicate {
  private readonly filePredicate: FilePredicate;

  constructor(filePredicate: FilePredicate) {
    super();
    this.filePredicate = filePredicate;
  }

  test(file: File): boolean {
    return !this.filePredicate.test(file);
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

  test(file: File): boolean {
    return this.left.test(file) || this.right.test(file);
  }
}

export class Extension extends AbstractFilePredicate {
  private readonly extensions: string[];

  constructor(extensions: string[]) {
    super();
    this.extensions = extensions;
  }

  test(file: File): boolean {
    return _.includes(this.extensions, file.getPathExtension());
  }
}

export class Glob extends AbstractFilePredicate {
  private readonly globPattern: string;

  constructor(globPattern: string) {
    super();
    this.globPattern = globPattern;
  }

  test(file: File): boolean {
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

  test(file: File): boolean {
    return new RegExp(this.pattern, this.flags).test(file.getName());
  }
}

export class CustomFilter extends AbstractFilePredicate {
  private readonly fn: (path: File) => boolean;

  constructor(fn: (path: File) => boolean) {
    super();
    this.fn = fn;
  }

  test(file: File): boolean {
    return this.fn(file);
  }
}

export class Size extends AbstractFilePredicate {
  private readonly size: string | number;

  constructor(sizeExpression: string | number) {
    super();
    this.size = sizeExpression;
  }

  test(file: File): boolean {
    const actualSize = file.sizeSync();
    return isNumber(actualSize).assert(this.size);
  }
}

export class Modified extends AbstractFilePredicate {
  private readonly days: string | number;

  constructor(days: string | number) {
    super();
    this.days = days;
  }

  test(file: File): boolean {
    const lastModified = file.lastModifiedSync();
    return isDate(lastModified)
      .assert(this.days);
  }
}

export class Accessed extends AbstractFilePredicate {
  private readonly days: string | number;

  constructor(days: string | number) {
    super();
    this.days = days;
  }

  test(file: File): boolean {
    const lastAccessed = file.lastAccessedSync();
    return isDate(lastAccessed)
      .assert(this.days);
  }
}

export class Changed extends AbstractFilePredicate {
  private readonly days: string | number;

  constructor(days: string | number) {
    super();
    this.days = days;
  }

  test(file: File): boolean {
    const last = file.lastChangedSync();
    return isDate(last)
      .assert(this.days);
  }
}

export class MatchAll extends AbstractFilePredicate {
  test(_file: File): boolean {
    return true;
  }
}

export class Socket extends AbstractFilePredicate {
  test(file: File): boolean {
    return file.isSocketSync();
  }
}

/**
 * Matches files with any of the given extensions. A leading dot is optional.
 *
 * @param args - one or more extensions, or an array of extensions
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(ext('json', '.txt'));
 * ```
 */
export function ext(...args: any[]): FilePredicate {
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
 * Matches files whose path satisfies a glob pattern
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
 * Matches files using a custom function
 *
 * @param fn - returns true for files to include
 * @returns the predicate
 * @example
 * ```ts
 * FileHound.create().match(applyFilter(file => file.sizeSync() > 0));
 * ```
 */
export function applyFilter(fn: (path: File) => boolean): FilePredicate {
  return new CustomFilter(fn);
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
    .map(pattern => new TextMatch(pattern))
    .reduce((a: any, b: any) => {
      return a.or(b);
    })
    .not();
}

function cleanExtension(fileExtension: string): string {
  if (_.startsWith(fileExtension, '.')) {
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
