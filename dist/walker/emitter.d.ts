import { EventEmitter } from 'events';
import { File } from '../file';
export type EntryFilter = (file: File) => boolean;
export declare class FileEmitter extends EventEmitter {
    private readonly root;
    private stopped;
    private pending;
    private readonly accept;
    constructor(root: string, accept?: EntryFilter);
    stop(): void;
    start(): Promise<void>;
    walk(directory: File): Promise<void>;
}
