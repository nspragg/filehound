import * as path from 'path';

// dirname is a fixed point at a root (`/`, `C:\`) and at `.`
function hasParent(parent: string): boolean {
  return path.dirname(parent) !== parent;
}

function getParent(dir: string): string {
  return path.dirname(dir);
}

function getSubDirectories(base: string, allPaths: string[]): string[] {
  return allPaths.filter((candidate) => {
    return base !== candidate && isSubDirectory(base, candidate);
  });
}

export function findSubDirectories(paths: string[]): string[] {
  return paths.flatMap(p => getSubDirectories(p, paths));
}

export function notSubDirectory(subDirs: string[]): (s: string) => boolean {
  return (p) => !subDirs.includes(p);
}

export function isSubDirectory(base: string, candidate: string): boolean {
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

  const sortedPaths = searchPaths.toSorted();
  const subDirs = findSubDirectories(sortedPaths);
  return sortedPaths.filter(notSubDirectory(subDirs));
}
