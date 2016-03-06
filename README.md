# Filehound

Flexible and fluent interface for searching the file system

## Installation

## Features

* Flexible search filters
* Simple fluent interface
* Ability to combine search results from multiple queries
* Supports promises and callbacks

```
npm install --save filehound
```
## Usage

```js
var FileHound = require('nspragg/filehound').create()

const files = FileHound.create()
  .path('/some/dir')
  .ext('json')
  .find();

  files.then(console.log); // prints list of json files found

const files = FileHound.create()
  .path('/some/dir')
  .ext('txt')
  .size('>1024')
  .find();

  files.then(console.log); // prints list of text files larger than 1024 bytes

const files = FileHound.create()
  .path('/etc/pki/')
  .match('dev*')
  .ext('pem')
  .find();

  files.then(console.log); // prints list of pem files starting with 'dev'

const notJsonFiles = FileHound
  .create()
  .ext('json')
  .not()
  .find();

  notJsonFiles.then(console.log) // prints all files except json
```

## API

### Static methods

### `.create()  -> FileHound`

##### Parameters
* `opts` - _optional_ - Object contains configuration options
  * debug - display search information.
  * root - override default root

##### Returns
Returns a FileHound instance.

### `.any(FileHound...)  -> Promise`

##### Parameters
* Accepts one or more instance of FileHound. Will unpack an array.

##### Returns
Returns a Promise of all matches. If the Promise fulfills, the fulfullment value is an array of all matching files.

### `.findFiles(path, globPattern) -> Promise`

##### Parameters
* `path` - Root path to search recursively
* `globPattern` - Optional file glob. By default, will match all files

##### Returns
* If the Promise fulfills, the fulfullment value is an array of matching files.

### `.not(FileHound...) -> Promise`

##### Parameters
* Accepts one or more instances of FileHound to negate. Will unpack an array.

##### Returns
* If the Promise fulfills, the fulfullment value is an array of negated matches

## Methods

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

### `.find() -> Promise`
##### Parameters - None
##### Returns
* Returns a Promise of all matches. If the Promise fulfills, the fulfullment value is an array of all matching files.

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
