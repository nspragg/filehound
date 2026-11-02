# Migrating from V1 to V2

V2 is a rewrite in TypeScript. The fluent style is the same, but matching moved from methods on `FileHound` to predicates passed to `.match()`, and some results differ. This guide covers every change you may need to make, then what's new.

## Requirements and packaging

- **Node.js 24 or later** is required.
- **ESM only, with a named export.** The default export is gone:

  ```js
  // V1
  import FileHound from 'filehound';

  // V2
  import { FileHound } from 'filehound';
  ```

  CommonJS still works on Node 24, which can `require()` ES modules:

  ```js
  const { FileHound } = require('filehound');
  ```

- **TypeScript types are included.**
- **Native promises.** `find()` no longer returns a Bluebird promise, so `.each()` and `.map()` on the result are gone, and `find()` no longer takes a callback:

  ```js
  // V1
  FileHound.create().find().each(console.log);
  FileHound.create().find((err, files) => { /* ... */ });

  // V2
  const files = await FileHound.create().find();
  files.forEach(file => console.log(file));
  ```

## Matching

V1 had a method for each filter. In V2, each filter is a predicate, imported from `filehound` and passed to `.match()`:

```js
// V1
FileHound.create().ext('json').find();

// V2
import { FileHound, ext } from 'filehound';

FileHound.create().match(ext('json')).find();
```

| V1 | V2 |
|---|---|
| `.ext('json', 'txt')` | `.match(ext('json', 'txt'))` |
| `.size('<10kb')` | `.match(size('<10kb'))` |
| `.size(1024)` | `.match(sizeEquals(1024))` |
| `.isEmpty()` | `.match(isEmpty())` |
| `.glob('*.json')`, `.match('*.json')` | `.match(glob('**/*.json'))`, see [glob patterns](#glob-patterns) |
| `.glob(['*.json', '*.txt'])` | `.match(glob('**/*.json').or(glob('**/*.txt')))` |
| `.discard('node_modules')` | `.match(discard('node_modules'))` |
| `.modified('<2 days')` | `.match(modified('<2 days'))` |
| `.modified(10)` | `.match(modified('=10 days'))` |
| `.accessed(...)`, `.changed(...)` | `.match(accessed(...))`, `.match(changed(...))` |
| `.addFilter(fn)` | `.match(applyFilterSync(fn))`, or `applyFilter(fn)` for an async `fn` |
| `.not()` | `not(predicate)` or `predicate.not()` |
| `.directory()` | `.type(FileType.DIRECTORY)` |
| `.socket()` | Removed |
| `.path('/tmp')` | `.paths('/tmp')` |
| `.getSearchPaths()` | `.getPaths()` |

Size and date expressions, such as `'<10kb'` and `'<2 days'`, are unchanged. But `size()`, `modified()`, `accessed()` and `changed()` now take only an expression, and throw a `TypeError` for a number. For an exact size, use `sizeEquals(bytes)`. For an exact age, use an expression such as `'=10 days'`.

### Combining filters

In V1, each filter method added a filter, and a file had to pass them all. In V2, `.match()` takes a single predicate, and **calling it again replaces the previous one**. Combine predicates with `.and()` and `.or()`:

```js
// V1
FileHound.create().ext('json').size('>1kb').find();

// V2
FileHound.create().match(ext('json').and(size('>1kb'))).find();
```

V1's `.not()` negated every filter at once. In V2, negate the predicate you mean:

```js
// V1
FileHound.create().not().glob('*tmp*').find();

// V2
FileHound.create().match(not(glob('**/*tmp*'))).find();
```

### Glob patterns

V1 matched a glob against the file's name at any depth (minimatch's `matchBase`). V2 matches it against the path relative to the search path, following Node's [`path.matchesGlob`](https://nodejs.org/api/path.html#pathmatchesglobpath-pattern), as `fs.glob` does. So a pattern without a `/` only matches at the top level of the search path. Add `**/` to match at any depth:

```js
// V1: .json files at any depth
FileHound.create().glob('*.json').find();

// V2: .json files at any depth
FileHound.create().match(glob('**/*.json')).find();

// V2: .json files at the top level only
FileHound.create().match(glob('*.json')).find();
```

Following Node, glob matching ignores case on macOS and Windows.

### Custom filters

The function passed to `applyFilterSync()` or `applyFilter()` receives a `FileView`, a read-only view of the file. V1 passed a [file-js](https://github.com/nspragg/file-js) `File`, which also had methods that change the file system, such as `delete()`. A `FileView` has none of them, nor any for listing a directory. It has methods for the file's name, paths, type, size, dates and stats, and its `FileView` type is exported for TypeScript.

A filter should have no side effects. V2 may call filters ahead of returning matches, at the same time as each other, and on files that are never returned.

`applyFilter()` may be async, but only works with `find()` and `iterate()`. `findSync()` throws a `TypeError` for it, so use `applyFilterSync()` with `findSync()`.

## File types

`.type()` replaces `.directory()`, and takes `FileType.REGULAR`, `FileType.DIRECTORY` or both. The default is `FileType.REGULAR`. `FileType` is an object of strings, so `'regular'` and `'directory'` work too.

**`FileType.REGULAR` now means regular files only.** V1 returned everything that wasn't a directory, including sockets, FIFOs and devices. With `.socket()` gone, there is no way to search for sockets.

## Behaviour changes

- **Directories at the depth limit are returned.** With `.depth(n)` and `FileType.DIRECTORY`, directories at depth `n` are returned but not searched. So `.depth(0).type(FileType.DIRECTORY)` lists the search path's subdirectories, where V1 returned none.
- **Results come in a fixed order**: depth first, with the entries of each directory in name order. `find()`, `iterate()` and `findSync()` return the same results in the same order.
- **Symbolic links are followed safely.** Links are followed by default, as in V1. Broken links are skipped, and a link back to a directory already being searched isn't followed, so a search can't loop forever. Use the new `.ignoreSymlinks()` to leave links out.
- **`findSync()` now honours `.ignoreHiddenFiles()`.** V1 ignored it.
- **`match` events are emitted as matches are found,** and for directory searches too. V1 emitted them all after the search, and none for `.directory()` searches.
- **A query can't be changed once its search has started.** Calling a method such as `.match()` or `.depth()` after `find()`, `iterate()` or `findSync()` throws an `Error`.
- **Arguments are checked.**
  - `.depth()` throws a `RangeError` for a negative or non-integer depth.
  - `.type()` throws a `RangeError` when given no types and a `TypeError` for an unknown type.
  - `.match()` throws a `TypeError` for anything that isn't a predicate.
- **An invalid search path** rejects, or throws for `findSync()`, with `'<path>' is not a valid path`. The file system error is kept as the error's `cause`.
- **`FileHound.any()` takes queries,** and runs `find()` on each:

  ```js
  const files = await FileHound.any(query1, query2);
  ```

`.includeFileStats()` returns `{ path, stats }` for each match, as in V1. Its type is exported as `FileWithStats`.

## New in V2

- **`iterate()`** returns matches one at a time, as they're found, so a large search doesn't hold every match in memory:

  ```js
  for await (const file of query.iterate()) {
    console.log(file);
  }
  ```

  Leaving the loop early stops the search.

- **Cancellation.** Pass an `AbortSignal` to `find()` or `iterate()`:

  ```js
  const files = await query.find({ signal: AbortSignal.timeout(5000) });
  ```

  An aborted search rejects with the signal's reason.

- **`.ignoreSymlinks()`** leaves symbolic links out of a search.
- **Async custom filters** with `applyFilter()`.
- **New predicates:**
  - `like(pattern)` matches a path against a regular expression.
  - `matchAll()` matches everything.
  - `.and()`, `.or()` and `.not()` combine and negate predicates.
- **Faster searches.** In a benchmark of a 93,000 file tree, `find()` took about 50 ms against V1's 680 ms, and `findSync()` about 175 ms against 700 ms.
