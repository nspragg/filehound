# Filehound

[![Build Status](https://travis-ci.org/nspragg/filehound.svg)](https://travis-ci.org/nspragg/filehound) [![Coverage Status](https://coveralls.io/repos/github/nspragg/filehound/badge.svg?branch=master)](https://coveralls.io/github/nspragg/filehound?branch=master)

> Flexible and fluent interface for searching the file system

## Common examples

The example below prints all of the files in a directory that have the `.json` file extension:

```js
const FileHound = require('filehound');

const files = FileHound.create()
  .paths('/some/dir')
  .ext('json')
  .find();

files.then(console.log);
```

#### Matching the filename

Find all the files that start with `dev`:

```js
const files = FileHound.create()
  .paths('/etc/pki/')
  .match('dev*')
  .find();
```

#### Filtering by file size

Find all of the files in a directory that are larger than 1024 bytes:

```js
const files = FileHound.create()
  .paths('/some/dir')
  .size('>1024')
  .find();

const files = FileHound.create()
  .paths('/some/dir')
  .size('<=1mb')
  .find();
```

#### Combining filters

Find all the `.txt` files that are larger than 1024 bytes _and_ start with `note`:

```js
const files = FileHound.create()
  .paths('/etc/pki/')
  .match('note*')
  .ext('txt')
  .size('>1024')
  .find();
```

#### Inverse filtering

Find all of the files that _don't_ have the `.json` extension:

```js
const files = FileHound.create()
  .ext('json')
  .not()
  .find();
```

#### Limiting the depth of a recursive search

Find all files but _only_ in the current directory (recursion off):

```js
const files = FileHound.create()
  .depth(0)
  .find();
```

#### Combining multiple searches

Find all the files that are _either_ over 1K _or_ have the `.json` file extension:

```js
const filesOverOneK = FileHound.create()
  .paths('/some/dir')
  .size('>1k')
  .find();

const jsonFiles = FileHound.create()
  .paths('/some/dir')
  .ext('json')
  .find();

const files = FileHound.any(filesOverOneK, jsonFiles);
```

#### Defining multiple search locations

Find all JSON files in '/some/dir1' and '/some/dir2'

```js
const jsonFiles = FileHound.create()
  .paths('/some/dir1', '/some/dir2')
  .ext('json')
  .find();

const myPaths = ['/some/dir1', '/some/dir2'];
const jsonFiles = FileHound.create()
  .paths(myPaths)
  .ext('json')
  .find();
```

#### Search synchronously

Find all JSON files in '/tmp' synchronously

```js
const jsonFiles = FileHound.create()
  .paths('/tmp')
  .ext('json')
  .findSync();
```

#### Using callbacks

Find all empty text files in /tmp:

```js
FileHound.create()
  .paths('/tmp')
  .ext('txt')
  .isEmpty()
  .find((err, emptyTextFiles) => {
    console.log(emptyTextFiles);
  });
```

#### Including file stats information

Configure file objects, containing `path` and `stats`:

```js
const results = FileHound.create()
  .paths('/tmp')
  .ext('txt')
  .includeFileStats()
  .find();

  console.log(results) // `results` is an array of file objects
```

#### Binding to match, error and end events

Bind to a 'match' event to process each file on match:
```js
const filehound = FileHound.create();
  filehound.find();

  filehound.on('match', (file) => {
    console(`process ${file}`);
  });

  filehound.on('error', (error) => {
    console(`error ${error}`);
  });

  filehound.on('end', (file) => {
    console(`search complete`);
  });
```

#### Find files by matching content
See [FileSniffer](https://github.com/nspragg/filesniffer)
