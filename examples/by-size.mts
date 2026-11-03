import { FileHound, size } from 'filehound';

const files = await FileHound.create()
  .match(size('=0'))
  .find();

console.log(files);
