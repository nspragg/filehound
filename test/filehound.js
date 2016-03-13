'use strict';

const assert = require('assert');
const path = require('path');

const justFiles = qualifyNames(['/justFiles/a.json', '/justFiles/b.json', '/justFiles/dummy.txt']);
const nestedFiles = qualifyNames(['/nested/c.json', 'nested/d.json', '/nested/mydir/e.json']);
const textFiles = qualifyNames(['/justFiles/dummy.txt']);
const matchFiles = qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json']);

const files = require('../lib/files');
const FileHound = require('../lib/filehound');

function getAbsolutePath(file) {
  return path.join(__dirname + '/fixtures/', file);
}

function qualifyNames(names) {
  return names.map(getAbsolutePath);
}

describe('FileHound', () => {
  const fixtureDir = __dirname + '/fixtures';

  describe('.paths', () => {
    it('returns all files in a given directory', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/justFiles')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, justFiles);
        });
    });

    it('returns files performing a recursive search', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/nested')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, nestedFiles);
        });
    });

    it('returns matching files from multiple search paths', () => {
      const location1 = fixtureDir + '/nested';
      const location2 = fixtureDir + '/justFiles';

      const query = FileHound.create()
        .paths(location1, location2)
        .find();

      return query.then((files) => {
        const expected = nestedFiles.concat(justFiles).sort();
        assert.deepEqual(files, expected);
      });
    });

    it('removes duplicate paths', () => {
      const location1 = fixtureDir + '/nested';

      const fh = FileHound.create();
      fh.paths(location1, location1);

      assert.deepEqual(fh.getSearchPaths(), [location1]);
    });

    it('returns a defensive copy of the search directories', () => {
      const fh = FileHound.create();
      fh.paths('a', 'b', 'c');
      const directories = fh.getSearchPaths();
      directories.push('d');

      assert.equal(fh.getSearchPaths().length, 3);
    });

    it('normalises paths', () => {
      const location1 = fixtureDir + '/nested';
      const location2 = fixtureDir + '/nested/mydir';
      const location3 = fixtureDir + '/justFiles/moreFiles';
      const location4 = fixtureDir + '/justFiles';

      const fh = FileHound.create();
      fh.paths(location2, location1, location4, location3);

      assert.deepEqual(fh.getSearchPaths(), [location4, location1]);
    });
  });

  describe('callbacks', () => {
    it('supports callbacks', (done) => {
      FileHound.create()
        .paths(fixtureDir + '/justFiles')
        .find((err, files) => {
          assert.ifError(err);
          assert.deepEqual(files, justFiles);
          done();
        });
    });
  });

  describe('.ext', () => {
    it('returns files for a given ext', () => {
      const query = FileHound.create()
        .ext('txt')
        .paths(fixtureDir + '/justFiles')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, textFiles);
        });
    });
  });

  describe('.match', () => {
    it('returns files for given match name', () => {
      const query = FileHound.create()
        .match('*ab*.json')
        .paths(fixtureDir + '/mixed')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files.sort(), matchFiles);
        });
    });

    it('performs recursive search using matching on a given pattern', () => {
      const query = FileHound.create()
        .match('*.json')
        .paths(fixtureDir + '/nested')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files.sort(), nestedFiles);
        });
    });
  });

  describe('.not', () => {
    it('returns files not matching the given query', () => {
      const notJsonStartingWithZ = FileHound.create()
        .match('*.json')
        .paths(fixtureDir + '/justFiles')
        .not()
        .find();

      return notJsonStartingWithZ
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/justFiles/dummy.txt']));
        });
    });
  });

  describe('.any', () => {
    it('returns matching files for any query', () => {
      const jsonStartingWithZ = FileHound.create()
        .match('*.json')
        .paths(fixtureDir + '/justFiles')
        .find();

      const onlyTextFles = FileHound.create()
        .ext('txt')
        .paths(fixtureDir + '/justFiles')
        .find();

      const results = FileHound.any(jsonStartingWithZ, onlyTextFles);

      return results
        .then((files) => {
          assert.deepEqual(files, justFiles);
        });
    });
  });

  describe('.size', () => {
    it('returns files matched using the equality operator by default', () => {
      const sizeFile10Bytes = FileHound.create()
        .size(20)
        .paths(fixtureDir + '/justFiles')
        .find();

      return sizeFile10Bytes
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/justFiles/b.json']));
        });
    });

    it('returns files that equal a given number of bytes', () => {
      const sizeFile10Bytes = FileHound.create()
        .size('==20')
        .paths(fixtureDir + '/justFiles')
        .find();

      return sizeFile10Bytes
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/justFiles/b.json']));
        });
    });

    it('returns files greater than a given size', () => {
      const sizeGreaterThan1k = FileHound.create()
        .size('>1024')
        .paths(fixtureDir + '/sizes')
        .find();

      return sizeGreaterThan1k
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/sizes/2k.txt']));
        });
    });

    it('returns files less than a given size', () => {
      const sizeLessThan1k = FileHound.create()
        .size('<1024')
        .paths(fixtureDir + '/sizes')
        .find();

      return sizeLessThan1k
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt']));
        });
    });

    it('returns files less than or equal to a given size', () => {
      const lessThanOrEqualTo1k = FileHound.create()
        .size('<=1024')
        .paths(fixtureDir + '/sizes')
        .find();

      return lessThanOrEqualTo1k
        .then((files) => {
          assert.deepEqual(files, qualifyNames(
            ['/sizes/10b.txt', '/sizes/1b.txt', '/sizes/1k.txt']));
        });
    });

    it('returns files greater than or equal to a given size', () => {
      const greaterThanOrEqualTo1k = FileHound.create()
        .size('>=1024')
        .paths(fixtureDir + '/sizes')
        .find();

      return greaterThanOrEqualTo1k
        .then((files) => {
          assert.deepEqual(files, qualifyNames(
            ['/sizes/1k.txt', '/sizes/2k.txt']));
        });
    });

    it('returns files within a given size range', () => {
      const range = FileHound.create()
        .size('>0')
        .size('<=1024')
        .paths(fixtureDir + '/sizes')
        .find();

      return range
        .then((files) => {
          assert.deepEqual(files, qualifyNames(
            ['/sizes/10b.txt', '/sizes/1b.txt', '/sizes/1k.txt']));
        });
    });

    // it('returns files within for a specific size in megabytes');
    // it('returns files within for a specific size in gigabytes');
  });

  describe('.isEmpty()', () => {
    it('returns zero length files', () => {
      const allEmpty = FileHound.create()
        .isEmpty(20)
        .paths(fixtureDir + '/justFiles')
        .find();

      return allEmpty
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/justFiles/a.json', '/justFiles/dummy.txt']));
        });
    });
  });

  // describe('.depth', () => {
  //   it('returns max depth');
  // });
  //
  // describe('.contains', () => {
  //   it('returns files containing');
  // });

  describe('.addFilter', () => {
    it('returns files based on a custom filter', () => {
      const customFilter = FileHound.create()
        .addFilter((file) => {
          const stats = files.getStats(file);
          return stats.size === 1024;
        })
        .paths(fixtureDir + '/custom')
        .find();

      return customFilter
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/custom/passed.txt']));
        });
    });
  });
});
