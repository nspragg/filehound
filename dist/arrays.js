export function from(args) {
    const [first] = args;
    return Array.isArray(first) ? first : args;
}
