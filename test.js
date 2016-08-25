const FileHound = require('./lib/filehound');

const files = FileHound.create()
  .ext('json')
  .find();

files.then(console.log);
