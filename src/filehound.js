import _ from 'lodash';
import Promise from 'bluebird';
import path from 'path';
import {
  negate,
  compose
} from './functions';

import * as files from './files';
import File from '../lib/file';
import * as arrays from './arrays';

import {
  isDate,
  isNumber
} from 'unit-compare';

import {
  EventEmitter
} from 'events';

function isDefined(value) {
  return value !== undefined;
}

function flatten(a, b) {
  return a.concat(b);
}

function getFilename(file) {
  return file.getName();
}

function isRegExpMatch(pattern) {
  return (file) => {
    return new RegExp(pattern).test(file.getName());
  };
}

class FileHound extends EventEmitter {
  constructor() {
    super();
    this._filters = [];
    this._searchPaths = [];
    this._searchPaths.push(process.cwd());
    this._ignoreHiddenDirectories = false;
    this._isMatch = _.noop;
    this._sync = false;
  }

  static create() {
    return new FileHound();
  }

  static any() {
    const args = arrays.from(arguments);
    return Promise.all(args).reduce(flatten, []);
  }

  _atMaxDepth(root, dir) {
    const depth = dir.getDepthSync() - root.getDepthSync();
    return isDefined(this.maxDepth) && depth > this.maxDepth;
  }

  _shouldFilterDirectory(root, dir) {
    return this._atMaxDepth(root, dir) ||
      (this._ignoreHiddenDirectories && dir.isHiddenSync());
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
    this._sync = true;
    const root = File.create(dir);
    return this.search(root, root);
  }

  _searchAsync(dir) {
    const root = File.create(dir);
    return this.search(root, root).each((file) => {
      this.emit('match', file.getName());
    });
  }

  search(root, path) {
    if (this._shouldFilterDirectory(root, path)) return [];

    const getFiles = this._sync ? path.getFilesSync.bind(path) : path.getFiles.bind(path);

    return getFiles()
      .map((file) => {
        file = File.create(file);
        return file.isDirectorySync() ? this.search(root, file) : file;
      })
      .reduce(flatten, [])
      .filter(this._isMatch);
  }

  getSearchPaths() {
    const excludeSubDirs = files.reducePaths(this._searchPaths);
    return arrays.copy(excludeSubDirs);
  }

  modified(pattern) {
    this.addFilter((file) => {
      const modified = file.lastModifiedSync();
      return isDate(modified).assert(pattern);
    });
    return this;
  }

  accessed(pattern) {
    this.addFilter((file) => {
      const accessed = file.lastAccessedSync();
      return isDate(accessed).assert(pattern);
    });
    return this;
  }

  changed(pattern) {
    this.addFilter((file) => {
      const changed = file.lastChangedSync();
      return isDate(changed).assert(pattern);
    });
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
    this.addFilter(negate(isRegExpMatch(pattern)));
    return this;
  }

  ext(extension) {
    this.addFilter((file) => {
      return file.getPathExtension() === extension;
    });
    return this;
  }

  size(sizeExpression) {
    this.addFilter((file) => {
      const size = file.sizeSync();
      return isNumber(size).assert(sizeExpression);
    });
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
    this.addFilter((file) => {
      return file.isMatch(globPattern);
    });
    return this;
  }

  not() {
    this.negateFilters = true;
    return this;
  }

  ignoreHiddenFiles() {
    this.addFilter((file) => {
      return !file.isHiddenSync();
    });
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
    const searches = Promise.map(this.getSearchPaths(), searchAsync);

    return Promise
      .all(searches)
      .reduce(flatten)
      .map(getFilename)
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
      .reduce(flatten)
      .map(getFilename);
  }
}

module.exports = FileHound;
