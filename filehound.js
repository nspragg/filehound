const FileHound = require('./lib/filehound');

var reportFiles = FileHound.create()
    .depth(0)
    .ext('json')
    .find();

reportFiles
    .then((files) => {
        console.log(files);
    })
    .catch(console.error);
