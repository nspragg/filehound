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

class FileHound extends EventEmitter {
  constructor() {
    super();
    this.filters = [];
    this.searchPaths = [];
    this.searchPaths.push(process.cwd());
    this._ignoreHiddenDirectories = false;
  }

  static create() {
    return new FileHound();
  }

  static any() {
    const args = arrays.from(arguments);
    return bluebird.all(args).reduce(flatten, []);
  }

  _getFiles(dir) {
    return files.readFiles(dir).map(files.joinWith(dir));
  }

  _getFilesSync(dir) {
    return files.readFilesSync(dir).map(files.joinWith(dir));
  }

  _isMatch(file) {
    let isMatch = compose(this.filters);
    if (this.negateFilters) {
      isMatch = negate(isMatch);
    }
    return isMatch(file);
  }

  _atMaxDepth(root, dir) {
    const fn = files.getDepth;
    return isDefined(this.maxDepth) && (fn(root, dir) > this.maxDepth);
  }

  _shouldFilterDirectory(root, dir) {
    return this._atMaxDepth(root, dir) ||
      (this._ignoreHiddenDirectories && files.isHiddenDirectory(dir));
  }

  _search(root, dir) {
    if (this._shouldFilterDirectory(root, dir)) return [];

    return this._getFiles(dir)
      .map((file) => {
        return files.isDirectory(file) ? this._search(root, file) : file;
      })
      .reduce(flatten, [])
      .filter((file) => {
        return this._isMatch(file);
      })
      .each((file) => {
        this.emit('match', file);
      });
  }

  _searchSync(root, dir) {
    if (this._shouldFilterDirectory(root, dir)) return [];

    return this._getFilesSync(dir)
      .map((file) => {
        return files.isDirectory(file) ? this._search(root, file) : file;
      })
      .reduce(flatten, [])
      .filter((file) => {
        return this._isMatch(file);
      });
  }

  getSearchPaths() {
    const excludeSubDirs = files.reducePaths(this.searchPaths);
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
    this.filters.push(filter);
    return this;
  }

  paths() {
    this.searchPaths = _.uniq(arrays.from(arguments));
    return this;
  }

  path() {
    this.searchPaths = arrays.fromFirst(arguments);
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
    const searches = bluebird
      .map(this.getSearchPaths(), (dir) => {
        return this._search(dir, dir);
      });

    return bluebird
      .all(searches)
      .reduce(flatten)
      .asCallback(cb)
      .finally(() => {
        this.emit('end');
      });
  }

  findSync() {
    const paths = this.getSearchPaths();
    const results = paths.map((path) => {
      return this._searchSync(path, path);
    });

    return results.reduce(flatten);
  }
}

module.exports = FileHound;
