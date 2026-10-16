'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fileJs = require('file-js');

var _fileJs2 = _interopRequireDefault(_fileJs);

var _functions = require('./functions');

var _files = require('./files');

var _arrays = require('./arrays');

var _unitCompare = require('unit-compare');

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function isDefined(value) {
  return value !== undefined;
}

function flatten(a, b) {
  return a.concat(b);
}

function isRegExpMatch(pattern) {
  return function (file) {
    return new RegExp(pattern).test(file.getName());
  };
}

function cleanExtension(ext) {
  if (_lodash2.default.startsWith(ext, '.')) {
    return ext.slice(1);
  }
  return ext;
}

/** @class */

var FileHound = function (_EventEmitter) {
  _inherits(FileHound, _EventEmitter);

  function FileHound() {
    _classCallCheck(this, FileHound);

    var _this = _possibleConstructorReturn(this, (FileHound.__proto__ || Object.getPrototypeOf(FileHound)).call(this));

    _this._filters = [];
    _this._searchPaths = [];
    _this._searchPaths.push(process.cwd());
    _this._ignoreHiddenDirectories = false;
    _this._isMatch = _lodash2.default.noop;
    _this._sync = false;
    _this._directoriesOnly = false;
    _this._includeStats = false;
    return _this;
  }

  /**
   * Static factory method to create an instance of FileHound
   *
   * @static
   * @memberOf FileHound
   * @method
   * create
   * @return FileHound instance
   * @example
   * import FileHound from 'filehound';
   *
   * const filehound = FileHound.create();
   */


  _createClass(FileHound, [{
    key: 'modified',


    /**
     * Filters by modifiction time
     *
     * @memberOf FileHound
     * @method
     * modified
     * @param {string} dateExpression - date expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .modified("< 2 days")
     *   .find()
     *   .each(console.log);
     */
    value: function modified(pattern) {
      this.addFilter(function (file) {
        var modified = file.lastModifiedSync();
        return (0, _unitCompare.isDate)(modified).assert(pattern);
      });
      return this;
    }

    /**
     * Filters by file access time
     *
     * @memberOf FileHound
     * @method
     * accessed
     * @param {string} dateExpression - date expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .accessed("< 10 minutes")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'accessed',
    value: function accessed(pattern) {
      this.addFilter(function (file) {
        var accessed = file.lastAccessedSync();
        return (0, _unitCompare.isDate)(accessed).assert(pattern);
      });
      return this;
    }

    /**
     * Filters change time
     *
     * @memberOf FileHound
     * @instance
     * @method
     * changed
     * @param {string} dateExpression - date expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .changed("< 10 minutes")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'changed',
    value: function changed(pattern) {
      this.addFilter(function (file) {
        var changed = file.lastChangedSync();
        return (0, _unitCompare.isDate)(changed).assert(pattern);
      });
      return this;
    }

    /**
     *
     * @memberOf FileHound
     * @instance
     * @method
     * addFilter
     * @param {function} function - custom filter function
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .addFilter(customFilter)
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'addFilter',
    value: function addFilter(filter) {
      this._filters.push(filter);
      return this;
    }

    /**
     * Defines the search paths
     *
     * @memberOf FileHound
     * @instance
     * @method
     * paths
     * @param {array} path - array of paths
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .paths("/tmp", "/etc") // or ["/tmp", "/etc"]
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'paths',
    value: function paths() {
      this._searchPaths = _lodash2.default.uniq((0, _arrays.from)(arguments)).map(_path2.default.normalize);
      return this;
    }

    /**
     * Define the search path
     *
     * @memberOf FileHound
     * @instance
     * @method
     * path
     * @param {string} path - path
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .path("/tmp")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'path',
    value: function path() {
      return this.paths((0, _arrays.fromFirst)(arguments));
    }

    /**
     * Ignores files or sub-directories matching pattern
     *
     * @memberOf FileHound
     * @instance
     * @method
     * discard
     * @param {string|array} regex - regex or array of regex
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .discard("*.tmp*")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'discard',
    value: function discard() {
      var _this2 = this;

      var patterns = (0, _arrays.from)(arguments);
      patterns.forEach(function (pattern) {
        _this2.addFilter((0, _functions.negate)(isRegExpMatch(pattern)));
      });
      return this;
    }

    /**
     * Filter on file extension
     *
     * @memberOf FileHound
     * @instance
     * @method
     * ext
     * @param {string|array} extensions - extension or an array of extensions
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * let filehound = FileHound.create();
     * filehound
     *   .ext(".json")
     *   .find()
     *   .each(console.log);
     *
     * // array of extensions to filter by
     * filehound = FileHound.create();
     * filehound
     *   .ext([".json", ".txt"])
     *   .find()
     *   .each(console.log);
     *
     * // supports var args
     * filehound = FileHound.create();
     * filehound
     *   .ext(".json", ".txt")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'ext',
    value: function ext() {
      var extensions = (0, _arrays.from)(arguments).map(cleanExtension);

      this.addFilter(function (file) {
        return _lodash2.default.includes(extensions, file.getPathExtension());
      });
      return this;
    }

    /**
     * Filter by file size
     *
     * @memberOf FileHound
     * @instance
     * @method
     * size
     * @param {string} sizeExpression - a size expression
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .size("<10kb")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'size',
    value: function size(sizeExpression) {
      this.addFilter(function (file) {
        var size = file.sizeSync();
        return (0, _unitCompare.isNumber)(size).assert(sizeExpression);
      });
      return this;
    }

    /**
     * Filter by zero length files
     *
     * @memberOf FileHound
     * @instance
     * @method
     * isEmpty
     * @param {string} path - path
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .size("<10kb")
     *   .find()
     *   .each(console.log);
     */

  }, {
    key: 'isEmpty',
    value: function isEmpty() {
      this.size(0);
      return this;
    }

    /**
     * Filter by a file glob
     *
     * @memberOf FileHound
     * @instance
     * @method
     * glob
     * @param {array} glob - array of globs
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .glob(['*tmp*']) // .glob('*tmp*') || .glob('*tmp1*','*tmp2*')
     *   .find()
     *   .each(console.log); // array of files names all containing 'tmp'
     */

  }, {
    key: 'glob',
    value: function glob() {
      return this.match((0, _arrays.from)(arguments));
    }

    /**
     * Filter by a file glob
     *
     * @memberOf FileHound
     * @instance
     * @method
     * match
     * @param {array} glob - array of globs
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .match(['*tmp*']) // .match('*tmp*')
     *   .find()
     *   .each(console.log); // array of files names all containing 'tmp'
     */

  }, {
    key: 'match',
    value: function match(globPatterns) {
      if (_lodash2.default.isArray(globPatterns)) {
        this.addFilter(function (file) {
          var isMatch = globPatterns.filter(function (globPattern) {
            return file.isMatch(globPattern);
          })[0];
          return isMatch ? true : false;
        });
      } else {
        this.addFilter(function (file) {
          return file.isMatch(globPatterns);
        });
      }
      return this;
    }

    /**
     * Negates filters
     *
     * @memberOf FileHound
     * @instance
     * @method
     * not
     * @param {string} glob - file glob
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .not()
     *   .glob("*tmp*")
     *   .find()
     *   .each(console.log); // array of files names NOT containing 'tmp'
     */

  }, {
    key: 'not',
    value: function not() {
      this.negateFilters = true;
      return this;
    }

    /**
     * Filter to ignore hidden files
     *
     * @memberOf FileHound
     * @instance
     * @method
     * ignoreHiddenFiles
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .ignoreHiddenFiles()
     *   .find()
     *   .each(console.log); // array of files names that are not hidden files
     */

  }, {
    key: 'ignoreHiddenFiles',
    value: function ignoreHiddenFiles() {
      this.addFilter(function (file) {
        return !file.isHiddenSync();
      });
      return this;
    }

    /**
     * Ignore hidden directories
     *
     * @memberOf FileHound
     * @instance
     * @method
     * ignoreHiddenDirectories
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .ignoreHiddenDirectories()
     *   .find()
     *   .each(console.log); // array of files names that are not hidden directories
     */

  }, {
    key: 'ignoreHiddenDirectories',
    value: function ignoreHiddenDirectories() {
      this._ignoreHiddenDirectories = true;
      return this;
    }

    /**
     * Include file stats 
     *
     * @memberOf FileHound
     * @instance
     * @method
     * includeFileStats
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .includeFileStats()
     *   .find()
     *   .each(console.log); // array of file objects containing `path` and `stats` properties
     */

  }, {
    key: 'includeFileStats',
    value: function includeFileStats() {
      this._includeStats = true;
      return this;
    }

    /**
     * Find sub-directories
     *
     * @memberOf FileHound
     * @instance
     * @method
     * directory
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .directory()
     *   .find()
     *   .each(console.log); // array of matching sub-directories
     */

  }, {
    key: 'directory',
    value: function directory() {
      this._directoriesOnly = true;
      return this;
    }

    /**
     * Find sockets
     *
     * @memberOf FileHound
     * @instance
     * @method
     * socket
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .socket()
     *   .find()
     *   .each(console.log); // array of matching sockets
     */

  }, {
    key: 'socket',
    value: function socket() {
      this.addFilter(function (file) {
        return file.isSocket();
      });
      return this;
    }

    /**
     * Specify the directory search depth. If set to zero, recursive searching
     * will be disabled
     *
     * @memberOf FileHound
     * @instance
     * @method
     * depth
     * @return a FileHound instance
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .depth(0)
     *   .find()
     *   .each(console.log); // array of files names only in the current directory
     */

  }, {
    key: 'depth',
    value: function depth(_depth) {
      this.maxDepth = _depth;
      return this;
    }

    /**
     * Asynchronously executes a file search.
     *
     * @memberOf FileHound
     * @instance
     * @method
     * find
     * @param {function} function - Optionally accepts a callback function
     * @return Returns a Promise of all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * filehound
     *   .find()
     *   .each(console.log);
     *
     * // using a callback
     * filehound
     *   .find((err, files) => {
     *      if (err) return console.error(err);
     *
     *      console.log(files);
     *   });
     */

  }, {
    key: 'find',
    value: function find(cb) {
      var _this3 = this;

      this._initFilters();

      var searchAsync = this._searchAsync.bind(this);
      var searches = _bluebird2.default.map(this.getSearchPaths(), searchAsync);

      return _bluebird2.default.all(searches).reduce(flatten).map(this.formatResult.bind(this)).catch(function (e) {
        _this3.emit('error', e);
        throw e;
      }).finally(function () {
        _this3.emit('end');
      }).asCallback(cb);
    }

    /**
     * Synchronously executes a file search.
     *
     * @memberOf FileHound
     * @instance
     * @method
     * findSync
     * @return Returns an array of all matching files
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.create();
     * const files = filehound.findSync();
     * console.log(files);
     *
     */

  }, {
    key: 'findSync',
    value: function findSync() {
      this._initFilters();

      var searchSync = this._searchSync.bind(this);

      return this.getSearchPaths().map(searchSync).reduce(flatten).map(this.formatResult.bind(this));
    }
  }, {
    key: '_atMaxDepth',
    value: function _atMaxDepth(root, dir) {
      var depth = dir.getDepthSync() - root.getDepthSync();
      return isDefined(this.maxDepth) && depth > this.maxDepth;
    }
  }, {
    key: '_shouldFilterDirectory',
    value: function _shouldFilterDirectory(root, dir) {
      return this._atMaxDepth(root, dir) || this._ignoreHiddenDirectories && dir.isHiddenSync();
    }
  }, {
    key: '_newMatcher',
    value: function _newMatcher() {
      var isMatch = (0, _functions.compose)(this._filters);
      if (this.negateFilters) {
        return (0, _functions.negate)(isMatch);
      }
      return isMatch;
    }
  }, {
    key: '_initFilters',
    value: function _initFilters() {
      this._isMatch = this._newMatcher();
    }
  }, {
    key: '_searchSync',
    value: function _searchSync(dir) {
      this._sync = true;
      var root = _fileJs2.default.create(dir);
      var trackedPaths = [];
      var files = this._search(root, root, trackedPaths);
      return this._directoriesOnly ? trackedPaths.filter(this._isMatch) : files;
    }
  }, {
    key: '_searchAsync',
    value: function _searchAsync(dir) {
      var _this4 = this;

      var root = _fileJs2.default.create(dir);
      var trackedPaths = [];
      var pending = this._search(root, root, trackedPaths);

      return pending.then(function (files) {
        if (_this4._directoriesOnly) return trackedPaths.filter(_this4._isMatch);

        files.forEach(function (file) {
          _this4.emit('match', file.getName());
        });
        return files;
      });
    }
  }, {
    key: '_search',
    value: function _search(root, path, trackedPaths) {
      var _this5 = this;

      if (this._shouldFilterDirectory(root, path)) return [];

      var getFiles = this._sync ? path.getFilesSync.bind(path) : path.getFiles.bind(path);
      return getFiles().map(function (file) {
        var isDir = false;
        try {
          isDir = file.isDirectorySync();
          // eslint-disable-next-line no-empty
        } catch (e) {}

        if (isDir) {
          if (!_this5._shouldFilterDirectory(root, file)) trackedPaths.push(file);
          return _this5._search(root, file, trackedPaths);
        }
        return file;
      }).reduce(flatten, []).filter(this._isMatch);
    }
  }, {
    key: 'formatResult',
    value: function formatResult(file) {
      if (this._includeStats) {
        return {
          path: file.getName(),
          stats: file._getStatsSync()
        };
      }
      return file.getName();
    }
  }, {
    key: 'getSearchPaths',
    value: function getSearchPaths() {
      var paths = isDefined(this.maxDepth) ? this._searchPaths : (0, _files.reducePaths)(this._searchPaths);

      return (0, _arrays.copy)(paths);
    }
  }], [{
    key: 'create',
    value: function create() {
      return new FileHound();
    }

    /**
     * Returns all matches from one of more FileHound instances
     *
     * @static
     * @memberOf FileHound
     * @method
     * any
     * @return a promise containing all matches. If the Promise fulfils,
     * the fulfilment value is an array of all matching files.
     * @example
     * import FileHound from 'filehound';
     *
     * const filehound = FileHound.any(fh1, fh2);
     */

  }, {
    key: 'any',
    value: function any() {
      var args = (0, _arrays.from)(arguments);
      return _bluebird2.default.all(args).reduce(flatten, []);
    }
  }]);

  return FileHound;
}(_events.EventEmitter);

exports.default = FileHound;