# Filehound

[![NPM downloads](https://img.shields.io/npm/dm/filehound.svg?style=flat)](https://npmjs.org/package/filehound)
![npm](https://img.shields.io/npm/v/filehound.svg)
[![Build Status](https://travis-ci.org/nspragg/filehound.svg)](https://travis-ci.org/nspragg/filehound) [![Coverage Status](https://coveralls.io/repos/github/nspragg/filehound/badge.svg?branch=master)](https://coveralls.io/github/nspragg/filehound?branch=master)
 ![license](https://img.shields.io/badge/license-MIT-blue.svg) 
![github-issues](https://img.shields.io/github/issues/nspragg/filehound.svg)
![stars](https://img.shields.io/github/stars/nspragg/filehound.svg)
![forks](https://img.shields.io/github/forks/nspragg/filehound.svg)
> Flexible and fluent interface for searching the file system

![nodei.co](https://nodei.co/npm/filehound.png?downloads=true&downloadRank=true&stars=true)


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

* If you're unsure if a feature would make a good addition, you can always [create an issue](https://github.com/nspragg/filehound/issues/new/choose) first.
* We aim for 100% test coverage. Please write tests for any new functionality or changes.
* Any API changes should be fully documented.
* Make sure your code meets our linting standards. Run `npm run lint` to check your code.
* Maintain the existing coding style. There are some settings in `.jsbeautifyrc` to help.
* Be mindful of others when making suggestions and/or code reviewing.
