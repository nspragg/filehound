'use strict';

const bluebird = require('bluebird');
const fsp = require('fs-promise');

const negate = require('./functions').negate;
const compose = require('./functions').compose;
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
    this.recursion = true;
  }

  static create() {
    return new FileHound();
  }

  static any() {
    return bluebird.all(arguments).reduce(flatten, []);
  }

  _getFiles(dir) {
    return readFiles(dir).map(joinWith(dir));
  }

  _isMatch(file) {
    let isMatch = compose(this.filters);
    if (this.negateFilters) {
      isMatch = negate(isMatch);
    }
    return isMatch(file);
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

  recursive(r) {
    r = typeof r === 'undefined' ? true : r;
    this.recursion = r;
    return this;
  }

  size(sizeExpression) {
    this.addFilter(sizeMatcher(sizeExpression));
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
        return (this.recursion && isDirectory(file)) ? this.search(file) : file;
      })
      .reduce(flatten, [])
      .filter((file) => {
        return this._isMatch(file);
      });
  }

  find(cb) {
    const searches = bluebird.map(this.getSearchPaths(), (dir) => {
      return this.search(dir);
    });
    return bluebird.all(searches).reduce(flatten).asCallback(cb);
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
