import {File} from 'file-js';
import * as _ from 'lodash';
import * as path from 'path';
import {isDate, isNumber} from 'unit-compare';
import {from} from './arrays';

export type Predicate = (...args: any[]) => boolean;

export enum FileType {
  S_IFDIR,
  S_IFREG
}

export interface FilePredicate {
  readonly fileType: FileType;

  not(): FilePredicate;

  or(predicate: FilePredicate): FilePredicate;

  and(predicate: FilePredicate): FilePredicate;

  test(file: File): boolean;
}

interface DirectoryOptions {
  excludeHidden: boolean;
}

export abstract class AbstractFilePredicate implements FilePredicate {
  readonly fileType: FileType;

  protected constructor(fileType: FileType = FileType.S_IFREG) {
    this.fileType = fileType;
  }

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
  private left: FilePredicate;
  private right: FilePredicate;

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
  private filePredicate: FilePredicate;

  constructor(filePredicate: FilePredicate) {
    super();
    this.filePredicate = filePredicate;
  }

  test(file: File): boolean {
    return !this.filePredicate.test(file);
  }
}

export class Or extends AbstractFilePredicate {
  private left: FilePredicate;
  private right: FilePredicate;

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

export class Directory extends AbstractFilePredicate {
  private readonly excludeHidden: boolean;

  constructor(options: DirectoryOptions = {excludeHidden: false}) {
    super(FileType.S_IFDIR);
    this.excludeHidden = options.excludeHidden;
  }

  test(path: File): boolean {
    if (this.excludeHidden && path.isHiddenSync()) {
      return false;
    }
    return path.isDirectorySync();
  }
}

export class Glob extends AbstractFilePredicate {
  private readonly globPattern: string;

  constructor(globPattern: string) {
    super();
    this.globPattern = globPattern;
  }

  test(path: File): boolean {
    return path.isMatch(this.globPattern);
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

  test(path: File): boolean {
    return new RegExp(this.pattern, this.flags).test(path.getName());
  }
}

export class CustomFilter extends AbstractFilePredicate {
  private readonly fn: (path: File) => boolean;

  constructor(fn: (path: File) => boolean) {
    super();
    this.fn = fn;
  }

  test(path: File): boolean {
    return this.fn(path);
  }
}

export class Size extends AbstractFilePredicate {
  private readonly size: string | number;

  constructor(pattern: string | number) {
    super();
    this.size = pattern;
  }

  test(path: File): boolean {
    const actualSize = path.sizeSync();
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
    const modified = file.lastModifiedSync();
    return isDate(modified)
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
    const accessed = file.lastAccessedSync();
    return isDate(accessed)
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

export class Socket extends AbstractFilePredicate {
  constructor() {
    super();
  }

  test(path: File): boolean {
    return path.isSocketSync();
  }
}

export function ext(...args: any[]): FilePredicate {
  const extensions = from(args).map(cleanExtension);
  return new Extension(extensions);
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

export function directories(options?: DirectoryOptions): FilePredicate {
  return new Directory(options);
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

export function discard2(...patterns: string[]): FilePredicate {
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
