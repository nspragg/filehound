export {FileHound, type FileWithStats, type SearchOptions} from './filehound.js';
export {FileType} from './filetype.js';
export type {FileView} from './file.js';
export {
  type FilePredicate,
  accessed,
  applyFilter,
  applyFilterSync,
  changed,
  discard,
  ext,
  glob,
  isEmpty,
  like,
  matchAll,
  modified,
  not,
  size,
  sizeEquals
} from './matchers.js';
// Thrown by size() and the date matchers for an invalid expression, so it can
// be caught without depending on unit-compare
export {ExpressionError} from 'unit-compare';
