import { FileHound, glob } from 'filehound';

const files = await FileHound.create()
  .match(glob('*test*'))
  .find();

console.log(files);
