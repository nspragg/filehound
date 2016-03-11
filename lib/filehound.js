'use strict';

const bluebird = require('bluebird');
const negate = require('./functions').negate;
const fsp = require('fs-promise');

const arrays = require('./arrays');
const iterables = require('./iterables');
const matchOn = require('./files').matchOn;
const joinWith = require('./files').joinWith;
const isDirectory = require('./files').isDirectory;
const sizeMatcher = require('./files').sizeMatcher;
const extMatcher = require('./files').extMatcher;
const findSubDirectories = require('./files').findSubDirectories;
const notSubDirectory = require('./files').notSubDirectory;

function flatten(a, b) {
  return a.concat(b);
}

function readFiles(dir) {
  return bluebird.resolve(fsp.readdir(dir));
}

class FileHound {
  constructor() {
    this.searchPaths = new Set();
    this.searchPaths.add(process.cwd());
    this.filters = [];
  }

  static create() {
    return new FileHound();
  }

  static any() {
    return bluebird
      .all(arguments)
      .reduce(flatten, []);
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

  addFilter(filter) {
    this.filters.push(filter);
    return this;
  }

  paths() {
    this.searchPaths = new Set(arguments);
    return this;
  }

  ext(extension) {
    this.addFilter(extMatcher(extension));
    return this;
  }

  size(bytes) {
    this.addFilter(sizeMatcher(bytes));
    return this;
  }

  isEmpty() {
    this.size(0);
    return this;
  }

  match(globPattern) {
    this.addFilter(matchOn(globPattern));
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
    const searches = bluebird.map(this.getSearchPaths(), (dir) => {
      return this.search(dir);
    });
    return bluebird.all(searches).reduce(flatten);
  }

  _reducePaths(searchPaths) {
    const allPaths = iterables.toArray(searchPaths);
    if (allPaths.length === 1) {
      return allPaths;
    }

    const subDirs = findSubDirectories(allPaths.sort());

    return allPaths.filter(notSubDirectory(subDirs));
  }

  getSearchPaths() {
    return arrays.copy(this._reducePaths(this.searchPaths));
  }
}

module.exports = FileHound;
