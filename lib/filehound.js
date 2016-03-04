'use strict';

const bluebird = require('bluebird');
const path = require('path');
const fileGlob = require('minimatch');
const negate = require('./functions').negate;
const fsp = require('fs-promise');

function matchOn(pattern) {
  return (fname) => {
    const glob = new fileGlob.Minimatch(pattern, {
      matchBase: true
    });
    return glob.match(fname);
  };
}

class FileHound {
  constructor() {
    this.root = process.cwd();
    this.filters = [];
  }

  static getExt(file) {
    return path.extname(file).substring(1);
  }

  static getStats(file) {
    return fsp.statSync(file);
  }

  static isDirectory(file) {
    return FileHound.getStats(file).isDirectory();
  }

  getFiles(dir) {
    let results = bluebird.resolve(fsp.readdir(dir));

    this.filters.forEach((filter) => {
      if (this.negateFilters) {
        filter = negate(filter);
      }
      results = results.filter(filter);
    });

    return results;
  }

  path(dir) {
    this.root = dir;
    return this;
  }

  ext(extension) {
    this.filters.push((file) => {
      return FileHound.getExt(file) === extension;
    });
    return this;
  }

  size(bytes) {
    this.filters.push((file) => {
      const stats = FileHound.getStats(path.join(this.root, file));
      return stats && (stats.size === bytes);
    });
    return this;
  }

  match(pattern) {
    this.filters.push(matchOn(pattern));
    return this;
  }

  not() {
    this.negateFilters = true;
    return this;
  }

  search(dir) {
    return this.getFiles(dir)
      .map((file) => {
        const absolutePath = path.join(dir, file);
        return FileHound.isDirectory(absolutePath) ? this.search(absolutePath) : absolutePath;
      })
      .reduce((f1, f2) => {
        return f1.concat(f2);
      }, []);
  }

  find() {
    return this.search(this.root);
  }
}

module.exports.create = function () {
  return new FileHound();
};

module.exports.any = function () {
  return bluebird
    .all(arguments)
    .reduce((a, b) => {
      return a.concat(b);
    }, []);
};
