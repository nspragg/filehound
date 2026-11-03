import { FileHound, not, ext } from 'filehound';

const files = await FileHound.create()
  .match(not(ext('json')))
  .find();

console.log(files);
