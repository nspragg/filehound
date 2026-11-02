export declare function findSubDirectories(paths: string[]): string[];
export declare function notSubDirectory(subDirs: string[]): (s: string) => boolean;
export declare function isSubDirectory(base: string, candidate: string): boolean;
export declare function reducePaths(searchPaths: string[]): string[];
