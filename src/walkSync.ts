function getDirNames(dir): string[] {
    const names = dir.getFilesSync();
    return names.sort();
}

export function walkSync(path, fn) {
    if (!path.isDirectorySync()) {
        return fn(path);
    }

    const cont = fn(path);
    if (!cont) return;

    const names = getDirNames(path);
    for (const name of names) {
        walkSync(name, fn);
    }
}
