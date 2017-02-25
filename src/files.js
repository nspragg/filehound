import _ from 'lodash';
import path from 'path';
import os from 'os';

function flatten(a, b) {
  return a.concat(b);
}

function hasParent(parent) {
  const root = getRoot(parent);
  return parent && (parent !== root && parent !== '.');
}

function getParent(dir) {
  return path.dirname(dir);
}

export function getRoot(dir) {
  return os.platform() === 'win32' ? dir.split(path.sep)[0] + path.sep : path.sep;
}

function getSubDirectories(base, allPaths) {
  return allPaths
    .filter((candidate) => {
      return base !== candidate && isSubDirectory(base, candidate);
    });
}

export function findSubDirectories(paths) {
  return paths
    .map((path) => {
      return getSubDirectories(path, paths);
    })
    .reduce(flatten, []);
}

export function notSubDirectory(subDirs) {
  return (path) => {
    return !_.includes(subDirs, path);
  };
}

export function isSubDirectory(base, candidate) {
  let parent = candidate;
  while (hasParent(parent)) {
    if (base === parent) {
      return true;
    }
    parent = getParent(parent);
  }
  return false;
}

export function reducePaths(searchPaths) {
  if (searchPaths.length === 1) {
    return searchPaths;
  }

  const subDirs = findSubDirectories(searchPaths.sort());
  return searchPaths.filter(notSubDirectory(subDirs));
}
