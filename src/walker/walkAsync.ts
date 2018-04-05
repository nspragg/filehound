async function getDirNames(dir) {
    const names = await dir.getFiles();
    return names.sort();
}

export async function walkAsync(path, fn) {
    if (!await path.isDirectory()) {
        return await fn(path);
    }

    const cont = await fn(path);
    if (!cont) { return; }

    const names = await getDirNames(path);
    for (const name of names) {
        await walkAsync(name, fn);
    }
}
