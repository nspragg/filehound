const fileGlob = require('minimatch');
const path = require('path');
const fs = require('fs');

function getStats(file) {
  return fs.statSync(file);
}

module.exports.joinWith = function (dir) {
  return function (file) {
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
  return function (file) {
    const stats = getStats(file);
    return stats && (stats.size === bytes);
  };
};

module.exports.getExt = function (file) {
  return path.extname(file).substring(1);
};

module.exports.isDirectory = function (file) {
  return getStats(file).isDirectory();
};
