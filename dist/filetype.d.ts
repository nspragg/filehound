/**
 * The types of file system entry that a search can return. The values are
 * plain strings, so `'directory'` can be passed in place of `FileType.DIRECTORY`.
 */
export declare const FileType: {
    /** Regular files only: not sockets, FIFOs or devices */
    readonly REGULAR: "regular";
    readonly DIRECTORY: "directory";
};
export type FileType = typeof FileType[keyof typeof FileType];
