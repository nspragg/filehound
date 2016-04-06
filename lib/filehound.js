'use strict';

const bluebird = require('bluebird');
const fsp = require('fs-promise');

const negate = require('./functions').negate;
const compose = require('./functions').compose;
const arrays = require('./arrays');
const iterables = require('./iterables');
const glob = require('./files').glob;
const match = require('./files').match;
const joinWith = require('./files').joinWith;
const isDirectory = require('./files').isDirectory;
const sizeMatcher = require('./files').sizeMatcher;
const extMatcher = require('./files').extMatcher;
const findSubDirectories = require('./files').findSubDirectories;
const notSubDirectory = require('./files').notSubDirectory;
const isVisibleFile = require('./files').isVisibleFile;
const pathDepth = require('./files').pathDepth;

function isDefined(value) {
  return value !== undefined;
}

function flatten(a, b) {
  return a.concat(b);
}

function readFiles(dir) {
  return bluebird.resolve(fsp.readdir(dir));
}

function getDepth(root, dir) {
  return pathDepth(dir) - pathDepth(root);
}

function isHiddenDirectory(dir) {
  return (/(^|\/)\.[^\/\.]/g).test(dir);
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

  _atMaxDepth(root, dir) {
    return isDefined(this.maxDepth) && (getDepth(root, dir) > this.maxDepth);
  }

  _shouldFilterDirectory(root, dir) {
    return this._atMaxDepth(root, dir) || (this.ignoreHiddenDirectories && isHiddenDirectory(dir));
  }

  addFilter(filter) {
    this.filters.push(filter);
    return this;
  }

  paths() {
    this.searchPaths = new Set(arguments);
    return this;
  }

  discard(pattern) {
    this.addFilter(negate(match(pattern)));
    return this;
  }

  ext(extension) {
    this.addFilter(extMatcher(extension));
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

  glob(globPattern) {
    return this.match(globPattern);
  }

  match(globPattern) {
    this.addFilter(glob(globPattern));
    return this;
  }

  not() {
    this.negateFilters = true;
    return this;
  }

  ignoreHiddenFiles(includeDirectories) {
    this.ignoreHiddenDirectories = includeDirectories ? true : false;
    this.addFilter(isVisibleFile);
    return this;
  }

  depth(depth) {
    this.maxDepth = depth;
    return this;
  }

  _search(root, dir) {
    if (this._shouldFilterDirectory(root, dir)) return [];

    return this._getFiles(dir)
      .map((file) => {
        return isDirectory(file) ? this._search(root, file) : file;
      })
      .reduce(flatten, [])
      .filter((file) => {
        return this._isMatch(file);
      });
  }

  find(cb) {
    const searches = bluebird.map(this.getSearchPaths(), (dir) => {
      return this._search(dir, dir);
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
