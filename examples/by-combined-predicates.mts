import { FileHound, size, ext, like } from 'filehound';

// Non-empty files that are either .js files or have "mymatch" in their name:
//   size > 0k AND (ext .js OR name like mymatch)
const files = await FileHound.create()
  .match(
     size('>0k')
       .and(ext('.js')
       .or(like('.*mymatch.*'))))
  .find();

console.log(files);
