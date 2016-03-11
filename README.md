# Filehound

[![Build Status](https://travis-ci.org/nspragg/filehound.svg)](https://travis-ci.org/nspragg/filehound)

> Flexible and fluent interface for searching the file system

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
  .path('/some/dir')
  .ext('json')
  .find();

files.then(console.log);
```

#### Matching the filename

Find all the files that start with `dev`:

```js
const files = FileHound.create()
  .path('/etc/pki/')
  .match('dev*')
  .find();
```

#### Filtering by file size

Find all of the files in a directory that are larger than 1024 bytes:

```js
const files = FileHound.create()
  .path('/some/dir')
  .size('>1024')
  .find();
```

#### Combining filters

Find all the `.txt` files that are larger than 1024 bytes _and_ start with `note`:

```js
const files = FileHound.create()
  .path('/etc/pki/')
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

#### Combing multiple searches

Find all the files that are _either_ over 1k _or_ have the `.json` file extension:

```js
const filesOverOneMB = FileHound.create()
  .path('/some/dir')
  .size('>1024')
  .find();

const jsonFiles = FileHound.create()
  .path('/some/dir')
  .ext('json')
  .find();

const files = FileHound.any(filesOverOneMB, jsonFiles);
```

## API

### Static methods

### `FileHound.create() -> FileHound`

##### Parameters
* `opts` - _optional_ - Object contains configuration options
  * debug - display search information.
  * root - override default root

##### Returns
Returns a FileHound instance.

### `FileHound.any(FileHound...) -> Promise`

##### Parameters
* Accepts one or more instances of FileHound. Will unpack an array.

##### Returns
Returns a Promise of all matches. If the Promise fulfills, the fulfillment value is an array of all matching files.

### `FileHound.not(FileHound...) -> Promise`

##### Parameters
* Accepts one or more instances of FileHound to negate. Will unpack an array.

##### Returns
* If the Promise fulfills, the fulfillment value is an array of negated matches

## Instance methods

### `.paths(paths...) -> FileHound`

Directories to search. Accepts one or more directories or a reference to an array of directories

##### Parameters
* path - array of directories

##### Returns
* Returns a FileHound instance

### `.ext(extension) -> FileHound`

##### Parameters
* extension - file extension to filter by

##### Returns
* Returns a FileHound instance

### `.match(glob) -> FileHound`

##### Parameters
* glob - file glob (as string) to filter by

##### Returns
* Returns a FileHound instance

### `.size(sizeExpression) -> FileHound`

##### Parameters
* sizeExpression - accepts a positive integer representing the file size in bytes. Optionally, can be prefixed with a comparison operator, including <, >, =, <=, >=  

##### Returns
* Returns a FileHound instance

### `.isEmpty() -> FileHound`

##### Parameters - None

##### Returns
* Returns a FileHound instance

### `.addFilter(fn) -> FileHound`

##### Parameters
* fn - accepts a custom file matching predicate    

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
