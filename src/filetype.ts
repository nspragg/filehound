/**
 * The types of file system entry that a search can return. The values are
 * plain strings, so `'directory'` can be passed in place of `FileType.DIRECTORY`.
 */
export const FileType = {
  /** Regular files only: not sockets, FIFOs or devices */
  REGULAR: 'regular',
  DIRECTORY: 'directory'
} as const;

export type FileType = typeof FileType[keyof typeof FileType];
