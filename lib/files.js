'use strict';

const _ = require('lodash');
const fileGlob = require('minimatch');
const fs = require('fs');
const path = require('path');
const pattern = /(<=|>=|<|>|==)?\s*(\d*)/;

function getStats(file) {
  return fs.statSync(file);
}

function flatten(a, b) {
  return a.concat(b);
}

function hasParent(parent) {
  return parent && (parent !== '/' && parent !== '.');
}

function getParent(dir) {
  return path.dirname(dir);
}

function getExt(file) {
  return path.extname(file).substring(1);
}

function isSubDirectory(base, candidate) {
  let parent = candidate;
  while (hasParent(parent)) {
    if (base === parent) {
      return true;
    }
    parent = getParent(parent);
  }
  return false;
}

function getSubDirectories(base, allPaths) {
  return allPaths
    .filter((candidate) => {
      return base !== candidate && isSubDirectory(base, candidate);
    });
}

module.exports.joinWith = (dir) => {
  return (file) => {
    return path.join(dir, file);
  };
};

module.exports.matchOn = (pattern) => {
  return (fname) => {
    const glob = new fileGlob.Minimatch(pattern, {
      matchBase: true
    });
    return glob.match(fname);
  };
};

module.exports.getStats = (file) => {
  return getStats(file);
};

module.exports.sizeMatcher = (sizeExpression) => {
  const matches = pattern.exec(sizeExpression);
  const operator = matches[1];
  const bytes = parseInt(matches[2]);

  return (file) => {
    const stats = getStats(file);

    let match = false;
    switch (operator) {
    case '>':
      match = stats && (stats.size > bytes);
      break;
    case '<':
      match = stats && (stats.size < bytes);
      break;
    case '<=':
      match = stats && (stats.size <= bytes);
      break;
    case '>=':
      match = stats && (stats.size >= bytes);
      break;
    case '==':
    default:
      match = stats && (stats.size === bytes);
    }

    return match;
  };
};

module.exports.findSubDirectories = (paths) => {
  return paths
    .map((path) => {
      return getSubDirectories(path, paths);
    })
    .reduce(flatten, []);
};

module.exports.notSubDirectory = (subDirs) => {
  return (path) => {
    return !_.includes(subDirs, path);
  };
};

module.exports.extMatcher = (extension) => {
  return (file) => {
    return getExt(file) === extension;
  };
};

module.exports.isDirectory = (file) => {
  return getStats(file).isDirectory();
};

module.exports.isVisibleFile = (path) => {
  const pathParts = path.split('/');
  return !/^\./.test(pathParts.pop());
};

module.exports.isSubDirectory = isSubDirectory;
