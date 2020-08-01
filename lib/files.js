'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRoot = getRoot;
exports.findSubDirectories = findSubDirectories;
exports.notSubDirectory = notSubDirectory;
exports.isSubDirectory = isSubDirectory;
exports.reducePaths = reducePaths;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function flatten(a, b) {
  return a.concat(b);
}

function hasParent(parent) {
  var root = getRoot(parent);
  return parent && parent !== root && parent !== '.';
}

function getParent(dir) {
  return _path2.default.dirname(dir);
}

function getRoot(dir) {
  return _os2.default.platform() === 'win32' ? dir.split(_path2.default.sep)[0] + _path2.default.sep : _path2.default.sep;
}

function getSubDirectories(base, allPaths) {
  return allPaths.filter(function (candidate) {
    return base !== candidate && isSubDirectory(base, candidate);
  });
}

function findSubDirectories(paths) {
  return paths.map(function (path) {
    return getSubDirectories(path, paths);
  }).reduce(flatten, []);
}

function notSubDirectory(subDirs) {
  return function (path) {
    return !_lodash2.default.includes(subDirs, path);
  };
}

function isSubDirectory(base, candidate) {
  var parent = candidate;
  while (hasParent(parent)) {
    if (base === parent) {
      return true;
    }
    parent = getParent(parent);
  }
  return false;
}

function reducePaths(searchPaths) {
  if (searchPaths.length === 1) {
    return searchPaths;
  }

  var subDirs = findSubDirectories(searchPaths.sort());
  return searchPaths.filter(notSubDirectory(subDirs));
}