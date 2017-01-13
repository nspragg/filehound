import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import fileGlob from 'minimatch';
import {
  isDate,
  isNumber
} from 'unit-compare';

const fsp = Promise.promisifyAll(fs);

function joinWith(dir) {
  return (file) => {
    return path.join(dir, file);
  };
}

class File {
  constructor(pathname) {
    this._pathname = pathname;
  }

  _getStatsSync() {
    return fs.statSync(this._pathname);
  }

  _getStats() {
    return fsp.statAsync(this._pathname);
  }

  isDirectorySync() {
    return this._getStatsSync().isDirectory();
  }

  isDirectory() {
    return this._getStats()
      .then((stats) => {
        return stats.isDirectory();
      });
  }

  isHiddenSync() {
    if (!this.isDirectorySync()) {
      return (/^\./).test(path.basename(this._pathname));
    }
    return (/(^|\/)\.[^\/\.]/g).test(this._pathname);
  }

  getFilesSync() {
    if (this.isDirectorySync()) {
      return fs.readdirSync(this._pathname).map((file) => {
        return path.join(this._pathname, file);
      });
    }
    return null;
  }

  getFiles() {
    return this.isDirectory()
      .then((isDirectory) => {
        if (isDirectory) {
          return fsp.readdirAsync(this._pathname).map(joinWith(this._pathname));
        }
        return null;
      });
  }

  _depth(pathname) {
    return pathname.split(path.sep).length - 1;
  }

  getDepthSync() {
    if (!this.isDirectorySync()) {
      return this._depth(path.dirname(this._pathname));
    }
    return this._depth(this._pathname);
  }

  getName() {
    return this._pathname;
  }

  getPathExtension() {
    return path.extname(this._pathname).substring(1);
  }

  isMatch(globPattern) {
    const glob = new fileGlob.Minimatch(globPattern, {
      matchBase: true
    });
    return glob.match(this._pathname);
  }

  lastModifiedSync() {
    return this._getStatsSync()['mtime'];
  }

  lastAccessedSync() {
    return this._getStatsSync()['atime'];
  }

  lastChangedSync() {
    return this._getStatsSync()['ctime'];
  }

  sizeSync() {
    return this._getStatsSync().size;
  }
}

module.exports.create = (filename) => {
  return new File(filename);
};
