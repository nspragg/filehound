import _ from 'lodash';
import bluebird from 'bluebird';
import path from 'path';

import {
  negate,
  compose
} from './functions';

import * as files from './files';
import * as arrays from './arrays';

import {
  EventEmitter
} from 'events';

function isDefined(value) {
  return value !== undefined;
}

function flatten(a, b) {
  return a.concat(b);
}

class FileHound extends EventEmitter {
  constructor() {
    super();
    this._filters = [];
    this._searchPaths = [];
    this._searchPaths.push(process.cwd());
    this._ignoreHiddenDirectories = false;
    this._isMatch = _.noop;
  }

  static create() {
    return new FileHound();
  }

  static any() {
    const args = arrays.from(arguments);
    return bluebird.all(args).reduce(flatten, []);
  }

  _atMaxDepth(root, dir) {
    const fn = files.getDepth;
    return isDefined(this.maxDepth) && (fn(root, dir) > this.maxDepth);
  }

  _shouldFilterDirectory(root, dir) {
    return this._atMaxDepth(root, dir) ||
      (this._ignoreHiddenDirectories && files.isHiddenDirectory(dir));
  }

  _newMatcher() {
    const isMatch = compose(this._filters);
    if (this.negateFilters) {
      return negate(isMatch);
    }
    return isMatch;
  }

  _initFilters() {
    this._isMatch = this._newMatcher();
  }

  _searchSync(dir) {
    const root = dir;
    return this.search(root, dir, files.getFilesSync);
  }

  _searchAsync(dir) {
    const root = dir;
    return this.search(root, dir, files.getFilesAsync).each((file) => {
      this.emit('match', file);
    });
  }

  search(root, dir, getFiles) {
    if (this._shouldFilterDirectory(root, dir)) return [];

    return getFiles(dir)
      .map((file) => {
        return files.isDirectory(file) ? this.search(root, file, getFiles) : file;
      })
      .reduce(flatten, [])
      .filter(this._isMatch);
  }

  getSearchPaths() {
    const excludeSubDirs = files.reducePaths(this._searchPaths);
    return arrays.copy(excludeSubDirs);
  }

  modified(pattern) {
    this.addFilter(files.utimeMatcher(pattern, 'mtime'));
    return this;
  }

  accessed(pattern) {
    this.addFilter(files.utimeMatcher(pattern, 'atime'));
    return this;
  }

  changed(pattern) {
    this.addFilter(files.utimeMatcher(pattern, 'ctime'));
    return this;
  }

  addFilter(filter) {
    this._filters.push(filter);
    return this;
  }

  paths() {
    this._searchPaths = _.uniq(arrays.from(arguments)).map(path.normalize);
    return this;
  }

  path() {
    return this.paths(arrays.fromFirst(arguments));
  }

  discard(pattern) {
    this.addFilter(negate(files.match(pattern)));
    return this;
  }

  ext(extension) {
    this.addFilter(files.extMatcher(extension));
    return this;
  }

  size(sizeExpression) {
    this.addFilter(files.sizeMatcher(sizeExpression));
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
    this.addFilter(files.glob(globPattern));
    return this;
  }

  not() {
    this.negateFilters = true;
    return this;
  }

  ignoreHiddenFiles() {
    this.addFilter(files.isVisibleFile);
    return this;
  }

  ignoreHiddenDirectories() {
    this._ignoreHiddenDirectories = true;
    return this;
  }

  depth(depth) {
    this.maxDepth = depth;
    return this;
  }

  find(cb) {
    this._initFilters();

    const searchAsync = this._searchAsync.bind(this);
    const searches = bluebird.map(this.getSearchPaths(), searchAsync);

    return bluebird
      .all(searches)
      .reduce(flatten)
      .catch((e) => {
        this.emit('error', e);
        throw e;
      })
      .finally(() => {
        this.emit('end');
      })
      .asCallback(cb);
  }

  findSync() {
    this._initFilters();

    const searchSync = this._searchSync.bind(this);

    return this.getSearchPaths()
      .map(searchSync)
      .reduce(flatten);
  }
}

module.exports = FileHound;
