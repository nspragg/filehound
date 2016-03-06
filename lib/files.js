const fileGlob = require('minimatch');
const fs = require('fs');
const path = require('path');

function getStats(file) {
  return fs.statSync(file);
}

function getExt(file) {
  return path.extname(file).substring(1);
}

module.exports.joinWith = function (dir) {
  return (file) => {
    return path.join(dir, file);
  };
};

module.exports.matchOn = function (pattern) {
  return (fname) => {
    const glob = new fileGlob.Minimatch(pattern, {
      matchBase: true
    });
    return glob.match(fname);
  };
};

module.exports.getStats = function (file) {
  return getStats(file);
};

module.exports.sizeMatcher = function sizeMatcher(bytes) {
  return (file) => {
    const stats = getStats(file);
    return stats && (stats.size === bytes);
  };
};

module.exports.extMatcher = function (extension) {
  return (file) => {
    return getExt(file) === extension;
  };
};

module.exports.isDirectory = function (file) {
  return getStats(file).isDirectory();
};
