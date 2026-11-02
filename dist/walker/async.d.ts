import { File } from '../file.js';
import type { FilePredicate } from '../matchers.js';
import { type WalkOptions } from './walk.js';
export declare function walkAsync(dir: string, matcher: FilePredicate, opts: WalkOptions): AsyncGenerator<File[]>;
