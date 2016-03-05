'use strict';

const bluebird = require('bluebird');
const negate = require('./functions').negate;
const fsp = require('fs-promise');
const matchOn = require('./files').matchOn;
const joinWith = require('./files').joinWith;
const isDirectory = require('./files').isDirectory;
const sizeMatcher = require('./files').sizeMatcher;
const getExt = require('./files').getExt;

function flatten(a, b) {
  return a.concat(b);
}

function readFiles(dir) {
  return bluebird.resolve(fsp.readdir(dir));
}

class FileHound {
  constructor() {
    this.searchDirectories = [process.cwd()];
    this.filters = [];
  }

  _getFiles(dir) {
    let results = readFiles(dir)
      .map(joinWith(dir));

    this.filters.forEach((filter) => {
      if (this.negateFilters) {
        filter = negate(filter);
      }
      results = results.filter(filter);
    });

    return results;
  }

  paths() {
    this.searchDirectories = Array.from(arguments);
    return this;
  }

  ext(extension) {
    this.filters.push((file) => {
      return getExt(file) === extension;
    });
    return this;
  }

  size(bytes) {
    this.filters.push(sizeMatcher(bytes));
    return this;
  }

  isEmpty() {
    this.size(0);
    return this;
  }

  match(globPattern) {
    this.filters.push(matchOn(globPattern));
    return this;
  }

  not() {
    this.negateFilters = true;
    return this;
  }

  search(dir) {
    return this._getFiles(dir)
      .map((file) => {
        return isDirectory(file) ? this.search(file) : file;
      })
      .reduce(flatten, []);
  }

  find() {
    const searches = bluebird.map(this.searchDirectories, (dir) => {
      return this.search(dir);
    });
    return bluebird.all(searches).reduce(flatten);
  }
}

module.exports.create = function () {
  return new FileHound();
};

module.exports.any = function () {
  return bluebird
    .all(arguments)
    .reduce(flatten, []);
};

module.exports.findFiles = (path, globPattern) => {
  return this
    .create()
    .paths(path)
    .match(globPattern)
    .find();
};
