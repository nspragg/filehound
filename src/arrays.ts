export function copy<T>(value: T): T {
  return structuredClone(value);
}

export function from(args: any[]): any[] {
  if (Array.isArray(args[0])) {
    return args[0];
  }
  return Array.prototype.slice.call(args);
}
