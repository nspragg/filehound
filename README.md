# Filehound

[![NPM downloads](https://img.shields.io/npm/dm/filehound.svg?style=flat)](https://npmjs.org/package/map-files)
[![Build Status](https://travis-ci.org/nspragg/filehound.svg)](https://travis-ci.org/nspragg/filehound) [![Coverage Status](https://coveralls.io/repos/github/nspragg/filehound/badge.svg?branch=master)](https://coveralls.io/github/nspragg/filehound?branch=master)
 ![license](https://img.shields.io/badge/license-MIT-blue.svg) 
![github-issues](https://img.shields.io/github/issues/nspragg/filehound.svg)
![stars](https://img.shields.io/github/stars/nspragg/filehound.svg)
![forks](https://img.shields.io/github/forks/nspragg/filehound.svg)
> Flexible and fluent interface for searching the file system

## Installation

```
npm install --save filehound
```

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
