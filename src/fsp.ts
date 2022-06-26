import * as fs from 'fs';
import * as util from 'util';

export const stat = util.promisify(fs.stat);
export const lstat = util.promisify(fs.lstat);
export const access = util.promisify(fs.access);
export const readdir = util.promisify(fs.readdir);
export const unlink = util.promisify(fs.unlink);
export const readLink = util.promisify(fs.readlink);
export const symLink = util.promisify(fs.symlink);
export const rmdir = util.promisify(fs.rmdir);
export const mkdir = util.promisify(fs.mkdir);
export const chmodSync = fs.chmodSync;
