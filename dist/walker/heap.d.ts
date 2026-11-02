export declare class Heap<T> {
    #private;
    constructor(precedes: (a: T, b: T) => boolean);
    get size(): number;
    push(item: T): void;
    pop(): T | undefined;
}
