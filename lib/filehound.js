'use strict';

const _ = require('lodash');
const bluebird = require('bluebird');
const negate = require('./functions').negate;
const fsp = require('fs-promise');
const matchOn = require('./files').matchOn;
const joinWith = require('./files').joinWith;
const isDirectory = require('./files').isDirectory;
const sizeMatcher = require('./files').sizeMatcher;
const extMatcher = require('./files').extMatcher;

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

  static create() {
    return new FileHound();
  }

  static any() {
    return bluebird
      .all(arguments)
      .reduce(flatten, []);
  }

  static findFiles(path, globPattern) {
    return FileHound
      .create()
      .paths(path)
      .match(globPattern)
      .find();
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
    this.searchDirectories = _.uniq(Array.from(arguments));
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
    const searches = bluebird.map(this.searchDirectories, (dir) => {
      return this.search(dir);
    });
    return bluebird.all(searches).reduce(flatten);
  }

  getSearchDirectories() {
    return _.cloneDeep(this.searchDirectories);
  }
}

module.exports = FileHound;
