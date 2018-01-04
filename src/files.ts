import * as _ from 'lodash';
import * as path from 'path';
import * as os from 'os';

function flatten(a, b) {
  return a.concat(b);
}

function hasParent(parent: string): boolean {
  const root = getRoot(parent);
  return parent && (parent !== root && parent !== '.');
}

function getParent(dir: string) {
  return path.dirname(dir);
}

export function getRoot(dir: string): string {
  return os.platform() === 'win32'
    ? dir.split(path.sep)[0] + path.sep
    : path.sep;
}

function getSubDirectories(
  base: string,
  allPaths: string[]
): string[] {
  return allPaths.filter((candidate) => {
    return base !== candidate && isSubDirectory(base, candidate);
  });
}

export function findSubDirectories(paths: string[]): string[] {
  return paths
    .map((path) => {
      return getSubDirectories(path, paths);
    })
    .reduce(flatten, []);
}

export function notSubDirectory(subDirs: string[]): (s: string) => boolean {
  return (path) => {
    return !_.includes(subDirs, path);
  };
}

export function isSubDirectory(base, candidate: string): boolean {
  let parent = candidate;
  while (hasParent(parent)) {
    if (base === parent) {
      return true;
    }
    parent = getParent(parent);
  }
  return false;
}

export function reducePaths(searchPaths: string[]): string[] {
  if (searchPaths.length === 1) {
    return searchPaths;
  }

  const subDirs = findSubDirectories(searchPaths.sort());
  return searchPaths.filter(notSubDirectory(subDirs));
}
