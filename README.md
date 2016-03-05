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

  files.then(console.log); // prints list of files found
```

## API

#### `.create`

Creates a FileHound instance.

## path

Sets the root directory to search

#### `fh.path('/etc/pki')`

## ext

Filter by file extension. The file ext does not have to be prefixed with a '.'

#### `fh.ext('txt')`

## match

Filter by file glob. 

#### `fh.match('csh*')`

## size

Filter by file size. Accepts an positive integer representing the file size in bytes. Optionally, can be prefixed by a comparison operator, including '<', '>', '=', '<=' '>='.  

#### `fh.size('10')`
#### `fh.size('> 10')`
#### `fh.size('<= 20')`
#### `fh.size('>= 20')`


## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
