# filehound

Fluent interface for finding files

## Installation

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

#### `.create  -> FileHound`

Creates a FileHound instance.

## path

Sets the root directory to search

#### `fh.path('/etc/pki') -> FileHound`

## ext

Filter by file extension. The file ext does not have to be prefixed with a '.'

#### `fh.ext('txt') -> FileHound`

## match

Filter by file glob.

#### `fh.match('csh*') -> FileHound`

## size

Filter by matching file size. Accepts an positive integer representing the file size in bytes. Optionally, can be prefixed by a comparison operator, including <, >, =, <=, >=  

#### `fh.size('>10') -> FileHound`

## find

Starts the file search, returning a Promise. If the Promise fulfills, the fulfullment value is a list of matching file.  

#### `fh.find() -> Promise`

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
