// A binary min-heap: pop returns the item that comes first by precedes
export class Heap<T> {
  readonly #items: T[] = [];
  readonly #precedes: (a: T, b: T) => boolean;

  constructor(precedes: (a: T, b: T) => boolean) {
    this.#precedes = precedes;
  }

  get size(): number {
    return this.#items.length;
  }

  push(item: T): void {
    const items = this.#items;
    let i = items.push(item) - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.#precedes(items[i], items[parent])) {
        break;
      }
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  pop(): T | undefined {
    const items = this.#items;
    const first = items[0];
    const last = items.pop();
    if (items.length > 0 && last !== undefined) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let next = i;
        if (left < items.length && this.#precedes(items[left], items[next])) {
          next = left;
        }
        if (right < items.length && this.#precedes(items[right], items[next])) {
          next = right;
        }
        if (next === i) {
          break;
        }
        [items[i], items[next]] = [items[next], items[i]];
        i = next;
      }
    }
    return first;
  }
}
