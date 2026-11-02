import type { FileView } from './file.js';
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
declare const sync: unique symbol;
export interface SyncFilePredicate extends FilePredicate {
    readonly [sync]: true;
}
export declare function isSyncPredicate(predicate: FilePredicate): predicate is SyncFilePredicate;
export declare abstract class AbstractFilePredicate implements FilePredicate {
    or(f: FilePredicate): FilePredicate;
    and(f: FilePredicate): FilePredicate;
    not(): FilePredicate;
    test(file: FileView): Promise<boolean>;
    abstract testSync(file: FileView): boolean;
}
export declare class And extends AbstractFilePredicate {
    #private;
    constructor(left: FilePredicate, right: FilePredicate);
    get [sync](): boolean;
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class Not extends AbstractFilePredicate {
    #private;
    constructor(filePredicate: FilePredicate);
    get [sync](): boolean;
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class Or extends AbstractFilePredicate {
    #private;
    constructor(left: FilePredicate, right: FilePredicate);
    get [sync](): boolean;
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class Extension extends AbstractFilePredicate {
    #private;
    readonly [sync] = true;
    constructor(extensions: string[]);
    testSync(file: FileView): boolean;
}
export declare class Glob extends AbstractFilePredicate {
    #private;
    readonly [sync] = true;
    constructor(globPattern: string);
    testSync(file: FileView): boolean;
}
export declare class TextMatch extends AbstractFilePredicate {
    #private;
    readonly [sync] = true;
    constructor(pattern: string, flags?: string);
    testSync(file: FileView): boolean;
}
export declare class CustomFilter extends AbstractFilePredicate {
    #private;
    constructor(fn: (file: FileView) => boolean | Promise<boolean>);
    test(file: FileView): Promise<boolean>;
    testSync(_file: FileView): boolean;
}
export declare class CustomFilterSync extends AbstractFilePredicate {
    #private;
    readonly [sync] = true;
    constructor(fn: (file: FileView) => boolean);
    testSync(file: FileView): boolean;
}
export declare class Size extends AbstractFilePredicate {
    #private;
    constructor(sizeExpression: string | number);
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class Modified extends AbstractFilePredicate {
    #private;
    constructor(expression: string);
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class Accessed extends AbstractFilePredicate {
    #private;
    constructor(expression: string);
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class Changed extends AbstractFilePredicate {
    #private;
    constructor(expression: string);
    test(file: FileView): Promise<boolean>;
    testSync(file: FileView): boolean;
}
export declare class MatchAll extends AbstractFilePredicate {
    readonly [sync] = true;
    testSync(_file: FileView): boolean;
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
export declare function ext(...extensions: string[]): FilePredicate;
/**
 * Matches files with any of the given extensions. A leading dot is optional.
 *
 * @param extensions - an array of extensions
 * @returns the predicate
 */
export declare function ext(extensions: string[]): FilePredicate;
/**
 * Matches every file
 *
 * @returns the predicate
 */
export declare function matchAll(): FilePredicate;
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
export declare function size(expression: string): FilePredicate;
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
export declare function sizeEquals(bytes: number): FilePredicate;
/**
 * Matches files with a size of zero bytes
 *
 * @returns the predicate
 */
export declare function isEmpty(): FilePredicate;
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
export declare function glob(globPattern: string): FilePredicate;
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
export declare function applyFilter(fn: (file: FileView) => boolean | Promise<boolean>): FilePredicate;
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
export declare function applyFilterSync(fn: (file: FileView) => boolean): FilePredicate;
/**
 * Matches files whose path satisfies a regular expression pattern
 *
 * @param pattern - the regular expression pattern
 * @returns the predicate
 */
export declare function like(pattern: string): FilePredicate;
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
export declare function discard(...patterns: string[]): FilePredicate;
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
export declare function modified(expression: string): FilePredicate;
/**
 * Matches files by when they were last accessed, using an age expression as
 * for {@link modified}
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 */
export declare function accessed(expression: string): FilePredicate;
/**
 * Matches files by when their status, such as their permissions, last
 * changed, using an age expression as for {@link modified}
 *
 * @param expression - the age expression
 * @returns the predicate
 * @throws `TypeError`
 * Thrown if the expression is not a string.
 */
export declare function changed(expression: string): FilePredicate;
/**
 * Negates a predicate
 *
 * @param fn - the predicate to negate
 * @returns a predicate that matches when the given one does not
 */
export declare function not(fn: FilePredicate): FilePredicate;
export {};
