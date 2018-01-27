async function search(file, fn) {
    if (!await file.isDirectory()) {
        return await fn(file);
    }

    const cont = await fn(file);
    if (!cont) return;

    const names = await file.getFiles();
    for (const file of names) {
        await search(file, fn);
    }
}

export async function walk(root, fn) {
    return await search(root, fn);
}
