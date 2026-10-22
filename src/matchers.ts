import {File} from './file';
import * as _ from 'lodash';
import * as path from 'path';
import {isDate, isNumber} from 'unit-compare';
import {from} from './arrays';

export type Predicate = (...args: any[]) => boolean;

export interface FilePredicate {
  not(): FilePredicate;

  or(predicate: FilePredicate): FilePredicate;

  and(predicate: FilePredicate): FilePredicate;

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

export class IgnoreHiddenFile extends AbstractFilePredicate {
  constructor() { super(); }

  test(file: File): boolean {
    return !file.isHiddenSync();
  }
}

export class IgnoreHiddenPath extends AbstractFilePredicate {
  constructor() { super(); }

  test(file: File): boolean {
    const name = file.getName();
    return !(/(^|\/)\.[^\/\.]/g).test(name) && !(/^\./).test(path.basename(name));
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

  constructor(pattern: string | number) {
    super();
    this.size = pattern;
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
  constructor() {
    super();
  }

  test(file: File): boolean {
    return file.isSocketSync();
  }
}

export function ext(...args: any[]): FilePredicate {
  const extensions = from(args).map(cleanExtension);
  return new Extension(extensions);
}

export function matchAll(): FilePredicate {
  return new MatchAll();
}

export function size(s:  number | string): FilePredicate {
  return new Size(s);
}

export function isEmpty(): FilePredicate {
  return new Size(0);
}

export function socket(): FilePredicate {
  return new Socket();
}

export function glob(globPattern: string): FilePredicate {
  return new Glob(globPattern);
}

export function ignoreHiddenFiles(): FilePredicate {
  return new IgnoreHiddenFile();
}

export function ignoreHiddenPath(): FilePredicate {
  return new IgnoreHiddenPath();
}

export function customFilter(fn: (path: File) => boolean): FilePredicate {
  return new CustomFilter(fn);
}

export function like(pattern: string): FilePredicate {
  return new TextMatch(pattern);
}

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

export function modified(days: number | string): FilePredicate {
  return new Modified(days);
}

export function accessed(days: number | string): FilePredicate {
  return new Accessed(days);
}

export function changed(days: number | string): FilePredicate {
  return new Changed(days);
}

export function not(fn: FilePredicate): FilePredicate {
  return new Not(fn);
}
