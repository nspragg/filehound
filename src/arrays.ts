export function from<T>(args: (T | T[])[]): T[] {
  const [first] = args;
  return Array.isArray(first) ? first : args as T[];
}
