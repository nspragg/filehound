import { File } from '../file.js';
import type { FilePredicate } from '../matchers.js';
import { type WalkOptions } from './walk.js';
export declare function walkSync(dir: string, matcher: FilePredicate, opts: WalkOptions): File[];
