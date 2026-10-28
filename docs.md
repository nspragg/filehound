# Filehound

[![CI](https://github.com/nspragg/filehound/actions/workflows/ci.yml/badge.svg)](https://github.com/nspragg/filehound/actions/workflows/ci.yml) [![Coverage Status](https://coveralls.io/repos/github/nspragg/filehound/badge.svg?branch=master)](https://coveralls.io/github/nspragg/filehound?branch=master)

> Flexible and fluent interface for searching the file system

## Common examples

The example below prints all of the files in a directory that have the `.json` file extension:

```js
const { FileHound, ext } = require('filehound');

const files = await FileHound.create()
  .paths('/some/dir')
  .match(ext('json'))
  .find();

console.log(files);
```

Or with ES modules or TypeScript:

```ts
import { FileHound, ext } from 'filehound';
```

The remaining examples assume the functions they use have been imported in the same way.

#### Matching the filename

Find all the files that start with `dev`:

```js
const files = await FileHound.create()
  .paths('/etc/pki/')
  .match(glob('dev*'))
  .find();
```

#### Filtering by file size

Find all of the files in a directory that are larger than 1024 bytes:

```js
const files = await FileHound.create()
  .paths('/some/dir')
  .match(size('>1024'))
  .find();
```

Sizes can also be given with units:

```js
const files = await FileHound.create()
  .paths('/some/dir')
  .match(size('<=1mb'))
  .find();
```

#### Filtering by date

Find all of the files modified in the last two days:

```js
const files = await FileHound.create()
  .paths('/some/dir')
  .match(modified('<2 days'))
  .find();
```

`accessed` and `changed` work in the same way.

#### Combining filters

Find all the `.txt` files that are larger than 1024 bytes _and_ start with `note`:

```js
const files = await FileHound.create()
  .paths('/etc/pki/')
  .match(
    glob('note*')
      .and(ext('txt'))
      .and(size('>1024'))
  )
  .find();
```

Use `or` to match _either_ filter:

```js
const files = await FileHound.create()
  .paths('/some/dir')
  .match(ext('json').or(ext('yaml')))
  .find();
```

#### Inverse filtering

Find all of the files that _don't_ have the `.json` extension:

```js
const files = await FileHound.create()
  .match(not(ext('json')))
  .find();
```

Exclude any paths matching a pattern:

```js
const files = await FileHound.create()
  .match(discard('node_modules'))
  .find();
```

#### Custom filters

Find all of the files that pass a custom test:

```js
const files = await FileHound.create()
  .paths('/some/dir')
  .match(applyFilter(file => file.getName().includes('report')))
  .find();
```

#### Finding directories

Search for directories instead of, or as well as, regular files:

```js
const directories = await FileHound.create()
  .paths('/some/dir')
  .type(FileType.DIRECTORY)
  .find();

const everything = await FileHound.create()
  .paths('/some/dir')
  .type(FileType.REGULAR, FileType.DIRECTORY)
  .find();
```

#### Ignoring hidden files and directories

```js
const files = await FileHound.create()
  .paths('/some/dir')
  .ignoreHiddenFiles()
  .ignoreHiddenDirectories()
  .find();
```

#### Limiting the depth of a recursive search

Find all files but _only_ in the current directory (recursion off):

```js
const files = await FileHound.create()
  .depth(0)
  .find();
```

#### Combining multiple searches

Find all the files that are _either_ over 1K _or_ have the `.json` file extension:

```js
const filesOverOneK = FileHound.create()
  .paths('/some/dir')
  .match(size('>1k'));

const jsonFiles = FileHound.create()
  .paths('/some/dir')
  .match(ext('json'));

const files = await FileHound.any(filesOverOneK, jsonFiles);
```

#### Defining multiple search locations

Find all JSON files in '/some/dir1' and '/some/dir2':

```js
const jsonFiles = await FileHound.create()
  .paths('/some/dir1', '/some/dir2')
  .match(ext('json'))
  .find();
```

Or pass the paths as an array:

```js
const myPaths = ['/some/dir1', '/some/dir2'];
const jsonFiles = await FileHound.create()
  .paths(myPaths)
  .match(ext('json'))
  .find();
```

#### Search synchronously

Find all JSON files in '/tmp' synchronously:

```js
const jsonFiles = FileHound.create()
  .paths('/tmp')
  .match(ext('json'))
  .findSync();
```

#### Binding to match, error and end events

Bind to a `match` event to process each file on match. Bind to the events before calling `find()`:

```js
const filehound = FileHound.create();

filehound.on('match', (file) => {
  console.log(`process ${file}`);
});

filehound.on('error', (error) => {
  console.log(`error ${error}`);
});

filehound.on('end', () => {
  console.log('search complete');
});

await filehound.find();
```

#### Queries can't be changed once a search starts

Once `find()` or `findSync()` has been called, changing the query throws an error. Create a new query for each search:

```js
const query = FileHound.create().paths('/some/dir');
await query.find();

query.match(ext('json')); // throws: Cannot modify query after search has started
```

#### Find files by matching content
See [FileSniffer](https://github.com/nspragg/filesniffer)
