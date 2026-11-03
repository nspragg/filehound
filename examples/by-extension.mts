import { FileHound, ext } from 'filehound';

const files = await FileHound.create()
  .match(ext('json'))
  .find();

console.log(files);
