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
Returns a Promise of all matches. If the Promise fulfills, the fulfillment value is an array of all matching files.

### `FileHound.not(FileHound...) -> Promise`

##### Parameters
* Accepts one or more instances of FileHound to negate. Will unpack an array.

##### Returns
* If the Promise fulfills, the fulfillment value is an array of negated matches

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
* sizeExpression - accepts a positive integer representing the file size. File size units are:
  * bytes, specified using __b__.
  * kilobytes, specified using __k__ or __kb__,
  * megabytes, specified using __m__ or __mb__
  * terabytes, specified using __t__ or __tb__
  * gigabytes, specified using __g__ or __gb__

  If no unit is specified, __bytes__ is used by default.

  Optionally, expressions can be prefixed with a comparison operator, including:
   * less than using __<__
   * greater than using __>__
   * equality using __==__ or __=__
   * less than or equal to using __<=__
   * greater than or equal to __\>=__  

  Examples:
  * equal to 10 bytes: __10__
  * equal to 10 bytes: __==10b__
  * less than 10 bytes: __<10__
  * greater than 50 megabytes: __>10mg__  

##### Returns
* Returns a FileHound instance

### `.modified(dateExpression) -> FileHound`

##### Parameters
* dateExpression - accepts a time unit. Time units are:
  * minutes, specified using __minutes__, __m__, __mins__, __min__.
  * hours, specified using __hours__, __h__, __hour__.
  * days, specified using __days__, __d__, __day__.

  If no unit is specified, __days__ is used by default.

  Optionally, expressions can be prefixed with a comparison operator, including:
   * less than using __<__
   * greater than using __>__
   * equality using __==__ or __=__

 If no comparison operator is specified, equality is used by default.

  Examples:
  * equal to 10 days: __10__
  * equal to 10 minutes: __== minutes__
  * less than 10 hours: __< 10 hours__
  * greater than 50 minutes: __>50minutes__  
  * less than 50 minutes: __<50m__  

##### Returns
* Returns a FileHound instance

### `.accessed(dateExpression) -> FileHound`
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
* Returns a Promise of all matches. If the Promise fulfills, the fulfillment value is an array of all matching files.

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
* Make sure your code meets our linting standards. Run `npm run lint` to check your code.
* Maintain the existing coding style. There are some settings in `.jsbeautifyrc` to help.
* Be mindful of others when making suggestions and/or code reviewing.
