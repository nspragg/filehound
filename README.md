# Filehound

[![Build Status](https://travis-ci.org/nspragg/filehound.svg)](https://travis-ci.org/nspragg/filehound) [![Coverage Status](https://coveralls.io/repos/github/nspragg/filehound/badge.svg?branch=master)](https://coveralls.io/github/nspragg/filehound?branch=master)

> Flexible and fluent interface for searching the file system

* [Installation](#installation)
* [Features](#features)
* [Demo](#demo)
* [Usage](#usage)
* [API](#api)
* [Instance methods](#instance-methods)
* [Test](#test)
* [Contributing](#contributing)

## Installation

```
npm install --save filehound
```

## Features

* Flexible search filters
* Simple fluent interface
* Ability to combine search results from multiple queries
* Supports promises and callbacks
* Supports events for efficient file processing

## Demo

<img src="https://cloud.githubusercontent.com/assets/917111/13683231/7e915c2c-e6fd-11e5-9d58-e7228cf76ccf.gif" width="600"/>

## Usage

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

## API

### Static methods

### `FileHound.create() -> FileHound`

##### Parameters - None

##### Returns
Returns a FileHound instance.

### `FileHound.any(FileHound...) -> Promise`

##### Parameters
* Accepts one or more instances of FileHound.

##### Returns
Returns a Promise of all matches. If the Promise fulfils, the fulfilment value is an array of all matching files.

### `FileHound.not(FileHound...) -> Promise`

##### Parameters
* Accepts one or more instances of FileHound to negate. Will unpack an array.

##### Returns
* If the Promise fulfils, the fulfilment value is an array of negated matches

## Instance methods

### `.paths(paths...) -> FileHound`

Directories to search.

##### Parameters
* path - one or more directories (as variable arguments) or a reference to an array of directories

##### Returns
* Returns a FileHound instance

### `.path(path) -> FileHound`

Directory to search.

##### Parameters
* path

##### Returns
* Returns a FileHound instance

### `.ext(extension) -> FileHound`

##### Parameters
* extension - file extension to filter by

##### Returns
* Returns a FileHound instance

### `.glob(globPattern) -> FileHound`

##### Parameters
* glob - file glob (as string) to filter by

##### Returns
* Returns a FileHound instance

### `.match(globPattern) -> FileHound`

synonym for .glob

### `.size(sizeExpression) -> FileHound`

##### Parameters
* sizeExpression - See [unit-compare](https://github.com/nspragg/unit-compare#parameters-2)

##### Returns
* Returns a FileHound instance

### `.modified(dateExpression) -> FileHound`

##### Parameters
* dateExpression - See [unit-compare](https://github.com/nspragg/unit-compare#parameters-8)

##### Returns
* Returns a FileHound instance

### `.accessed(dateExpression) -> FileHound`
##### Parameters
* dateExpression (see `.modified`)

##### Returns
* Returns a FileHound instance

### `.changed(dateExpression) -> FileHound`
##### Parameters
* dateExpression (see `.modified`)

##### Returns
* Returns a FileHound instance

### `.isEmpty() -> FileHound`

##### Parameters - None

##### Returns
* Returns a FileHound instance

### `.addFilter(fn) -> FileHound`

##### Parameters
* fn(file) - accepts a custom file matching predicate

##### Returns
* Returns a FileHound instance

### `.ignoreHiddenFiles() -> FileHound`

##### Parameters - none

##### Returns
* Returns a FileHound instance

### `.ignoreHiddenDirectory() -> FileHound`

##### Parameters - none

##### Returns
* Returns a FileHound instance

### `.discard(regularExpression) -> FileHound`

##### Parameters
* RegularExpression - accepts a regular expression (as string) matching sub-directories or files to ignore

##### Returns
* Returns a FileHound instance

### `.find() -> Promise`

##### Parameters - None

##### Returns
* Returns a Promise of all matches. If the Promise fulfils, the fulfilment value is an array of all matching files.

### `.findSync() -> array`

##### Parameters - None

##### Returns
* Returns an array of all matches.

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
## Contributing

* If you're unsure if a feature would make a good addition, you can always [create an issue](https://github.com/nspragg/filehound/issues/new) first.
* We aim for 100% test coverage. Please write tests for any new functionality or changes.
* Any API changes should be fully documented.
* Make sure your code meets our linting standards. Run `npm run lint` to check your code.
* Maintain the existing coding style. There are some settings in `.jsbeautifyrc` to help.
* Be mindful of others when making suggestions and/or code reviewing.
