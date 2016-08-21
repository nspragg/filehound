import _ from 'lodash';
import bluebird from 'bluebird';

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

// TODO: move to files
function getFiles(dir, read) {
  return read(dir).map(files.joinWith(dir));
}

function getFilesSync(dir) {
  return getFiles(dir, files.readFilesSync);
}

function getFilesAsync(dir) {
  return getFiles(dir, files.readFiles);
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

  _createMatcher() {
    const isMatch = compose(this._filters);
    if (this.negateFilters) {
      return negate(isMatch);
    }
    return isMatch;
  }

  _searchSync(dir) {
    const root = dir;
    return this.search(root, dir, getFilesSync);
  }

  _searchAsync(dir) {
    const root = dir;
    return this.search(root, dir, getFilesAsync).each((file) => {
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
    this._searchPaths = _.uniq(arrays.from(arguments));
    return this;
  }

  path() {
    this._searchPaths = arrays.fromFirst(arguments);
    return this;
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
    this._isMatch = this._createMatcher();

    const sync = this._searchAsync.bind(this);
    const searches = bluebird.map(this.getSearchPaths(), sync);

    return bluebird
      .all(searches)
      .reduce(flatten)
      .catch((e) => {
        this.emit('error', e);
        throw e;
      })
      .asCallback(cb)
      .finally(() => {
        this.emit('end');
      });
  }

  findSync() {
    this._isMatch = this._createMatcher();
    const fn = this._searchSync.bind(this);

    return this.getSearchPaths()
      .map(fn)
      .reduce(flatten);
  }
}

module.exports = FileHound;
