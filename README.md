# Filehound

[![NPM downloads](https://img.shields.io/npm/dm/filehound.svg?style=flat)](https://npmjs.org/package/filehound)
[![CI](https://github.com/nspragg/filehound/actions/workflows/ci.yml/badge.svg)](https://github.com/nspragg/filehound/actions/workflows/ci.yml) [![Coverage Status](https://coveralls.io/repos/github/nspragg/filehound/badge.svg?branch=master)](https://coveralls.io/github/nspragg/filehound?branch=master)
 ![license](https://img.shields.io/badge/license-MIT-blue.svg) 
![github-issues](https://img.shields.io/github/issues/nspragg/filehound.svg)
![stars](https://img.shields.io/github/stars/nspragg/filehound.svg)
![forks](https://img.shields.io/github/forks/nspragg/filehound.svg)
> Flexible and fluent interface for searching the file system

## Installation

```
npm install --save filehound
```

Requires Node.js 24 or later.

Upgrading from V1? See the [migration guide](./MIGRATING.md).

## Usage

The example below prints all of the files in a directory that have the `.json` file extension:

```js
import { FileHound, ext } from 'filehound';

const files = await FileHound.create()
  .paths('/some/dir')
  .match(ext('json'))
  .find();

console.log(files);
```

### Iterating over matches

`find()` waits for the whole search to finish. To handle each match as it's found, loop over `iterate()` instead. Matches come in the same order as `find()`, and the search only runs a little ahead of the loop, so a large search doesn't hold every match in memory:

```js
import { FileHound, ext } from 'filehound';

const query = FileHound.create()
  .paths('/some/dir')
  .match(ext('json'));

for await (const file of query.iterate()) {
  console.log(file);
}
```

Leaving the loop early stops the search, for example to find the first match only:

```js
for await (const file of query.iterate()) {
  console.log(`First match: ${file}`);
  break;
}
```

## Documentation
For more examples and API details, see [API documentation](https://nspragg.github.io/filehound/)

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
## Contributing

See [contributing guide](./CONTRIBUTING.md)

## Related modules

- Finding files by content - [FileSniffer](https://github.com/nspragg/filesniffer)
