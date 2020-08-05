import assert from 'assert';
import fs from 'fs';
import path from 'path';
import FileHound from '../lib/filehound';
import moment from 'moment';
import sinon from 'sinon';
import File from 'file-js';
import Promise from 'bluebird';

const justFiles = qualifyNames(['/justFiles/a.json', '/justFiles/b.json', '/justFiles/dummy.txt']);
const nestedFiles = qualifyNames(['/nested/c.json', 'nested/d.json', '/nested/mydir/e.json']);
const textFiles = qualifyNames(['/justFiles/dummy.txt']);
const mixedExtensions = qualifyNames(['/ext/dummy.json', '/ext/dummy.txt']);
const matchFiles = qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json']);

const sandbox = sinon.createSandbox();

function getAbsolutePath(file) {
  return path.join(__dirname + '/fixtures/', file);
}

function qualifyNames(names) {
  return names.map(getAbsolutePath);
}

function createFile(fname, opts) {
  const time = new Date(moment().subtract(opts.duration, opts.modifier));
  const fd = fs.openSync(fname, 'w+');
  fs.futimesSync(fd, time, time);
  fs.closeSync(fd);
}

function deleteFile(fname) {
  return fs.unlinkSync(fname);
}

describe('FileHound', () => {
  const fixtureDir = __dirname + '/fixtures';

  describe('.socket', () => {
    const file = {
      isSocket: () => {
        return true;
      },
      isDirectorySync: () => {
        return false;
      },
      getName: () => {
        return getAbsolutePath('/types/socket1');
      }
    };
    beforeEach(() => {
      const root = {
        getDepthSync: () => {
          return 0;
        },
        getFiles: () => {
          return Promise.resolve().then(() => {
            return [file];
          });
        }
      };
      sandbox.stub(File, 'create').returns(root);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('filters by socket type files', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/types')
        .socket()
        .find();

      return query
        .then((sockets) => {
          assert.deepEqual(sockets, [file.getName()]);
        });
    });
  });

  describe('.directory', () => {
    it('returns sub-directories of a given directory', () => {
      const expectedDirectories =
        qualifyNames([
          '/deeplyNested/mydir',
          '/deeplyNested/mydir/mydir2',
          '/deeplyNested/mydir/mydir2/mydir3',
          '/deeplyNested/mydir/mydir2/mydir3/mydir4']);

      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNested')
        .directory()
        .find();

      return query
        .then((directories) => {
          assert.deepEqual(directories, expectedDirectories);
        });
    });

    it('ignores hidden directories', () => {
      const expectedDirectories =
        qualifyNames([
          '/deeplyNestedWithHiddenDir/mydir',
          '/deeplyNestedWithHiddenDir/mydir/mydir2',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3/mydir4']);

      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNestedWithHiddenDir')
        .directory()
        .ignoreHiddenDirectories()
        .find();

      return query
        .then((directories) => {
          assert.deepEqual(directories, expectedDirectories);
        });
    });

    it('filters matching directories', () => {
      const expectedDirectories =
        qualifyNames([
          '/deeplyNested/mydir',
          '/deeplyNested/mydir/mydir2',
          '/deeplyNested/mydir/mydir2/mydir3']);

      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNested')
        .directory()
        .match('*dir4*')
        .not()
        .find();

      return query
        .then((directories) => {
          assert.deepEqual(directories, expectedDirectories);
        });
    });
  });

  describe('.depth', () => {
    it('only returns files in the current directory', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNested')
        .depth(0)
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/deeplyNested/c.json', 'deeplyNested/d.json']));
        });
    });

    it('only returns files one level deep', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNested')
        .depth(1)
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files,
            qualifyNames([
              '/deeplyNested/c.json', 'deeplyNested/d.json', 'deeplyNested/mydir/e.json']));
        });
    });

    it('returns files n level deep', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNested')
        .depth(3)
        .find();

      return query
        .then((files) => {
          files.sort();
          assert.deepEqual(files,
            qualifyNames([
              'deeplyNested/c.json',
              'deeplyNested/d.json',
              'deeplyNested/mydir/e.json',
              'deeplyNested/mydir/mydir2/f.json',
              'deeplyNested/mydir/mydir2/mydir3/z.json',
              'deeplyNested/mydir/mydir2/y.json'
            ]));
        });
    });

    it('returns files n level deep relative to path', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/deeplyNested', fixtureDir + '/deeplyNested/mydir')
        .depth(0)
        .find();

      return query
        .then((files) => {
          files.sort();
          assert.deepEqual(files,
            qualifyNames([
              'deeplyNested/c.json',
              'deeplyNested/d.json',
              'deeplyNested/mydir/e.json',
            ]));
        });
    });
  });

  describe('.path', () => {
    it('returns all files in a given directory', () => {
      const query = FileHound.create()
        .path(fixtureDir + '/justFiles')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, justFiles);
        });
    });

    it('ignores all paths except the first', () => {
      const location1 = fixtureDir + '/justFiles';
      const location2 = fixtureDir + '/nested';

      const query = FileHound.create()
        .path(location1, location2)
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, justFiles);
        });
    });

    it('returns an error when a given path is invalid', () => {
      const badLocation = fixtureDir + '/justBad';

      const query = FileHound.create()
        .path(badLocation)
        .find();

      return query
        .catch((err) => {
          assert.ok(err);
        });
    });
  });


  describe('.includeFileStats', () => {
    function includeFileStats(file) {
      return {
        path: file.path,
        stats: fs.statSync(file.path)
      };
    }

    it('returns a file object containing a path and file stats', () => {
      const query = FileHound.create()
        .path(fixtureDir + '/justFiles')
        .includeFileStats()
        .find();

      return query
        .then((files) => {
          const expected = files.map(includeFileStats);
          assert.deepEqual(files, expected);
        });
    });

    it('returns file stats for `findSync`', () => {
      const files = FileHound.create()
        .path(fixtureDir + '/justFiles')
        .includeFileStats()
        .findSync();

      const expected = files.map(includeFileStats);
      assert.deepEqual(files, expected);
    });
  });

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

    it('returns matching files given a array of paths', () => {
      const location1 = fixtureDir + '/nested';
      const location2 = fixtureDir + '/justFiles';

      const query = FileHound.create()
        .paths([location1, location2])
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

  describe('.discard', () => {
    it('ignores matching sub-directories', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/nested')
        .discard('mydir')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/nested/c.json', '/nested/d.json']));
        });
    });

    it('ignores files', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/nested')
        .discard('c\.json')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/nested/d.json', '/nested/mydir/e.json']));
        });
    });

    it('ignores everything using a greedy match', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/nested')
        .discard('.*')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, []);
        });
    });

    it('matches all files after being negated', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/nested')
        .discard('.*')
        .not()
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, nestedFiles);
        });
    });

    it('applies multiple discard filters as variable aruments', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/mixed')
        .discard('a\.json', 'z\.json')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json', '/mixed/acdc.json']));
        });
    });

    it('applies an array of discard filters', () => {
      const query = FileHound.create()
        .paths(fixtureDir + '/mixed')
        .discard(['a\.json', 'z\.json'])
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json', '/mixed/acdc.json']));
        });
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

    it('returns an error when a given path is invalid', (done) => {
      FileHound.create()
        .paths(fixtureDir + '/justBad')
        .find((err) => {
          assert.ok(err);
          done();
        });
    });
  });

  describe('.findSync', () => {
    it('returns an array of matching files', () => {
      const files = FileHound.create()
        .paths(fixtureDir + '/justFiles')
        .findSync();

      assert.deepEqual(files, justFiles);
    });

    it('filters matching directories', () => {
      const expectedDirectories =
        qualifyNames([
          '/deeplyNested/mydir',
          '/deeplyNested/mydir/mydir2',
          '/deeplyNested/mydir/mydir2/mydir3']);

      const directories = FileHound.create()
        .paths(fixtureDir + '/deeplyNested')
        .directory()
        .match('*dir4*')
        .not()
        .findSync();

      assert.deepEqual(directories, expectedDirectories);
    });

    it('filters matching files', () => {
      const files = FileHound.create()
        .paths(fixtureDir + '/justFiles')
        .ext('txt')
        .findSync();

      assert.deepEqual(files, textFiles);
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

    it('returns files for a given ext including a period', () => {
      const query = FileHound.create()
        .ext('.txt')
        .paths(fixtureDir + '/justFiles')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, textFiles);
        });
    });

    it('returns files for all matching extensions', () => {
      const query = FileHound.create()
        .ext(['txt', '.json'])
        .paths(fixtureDir + '/ext')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, mixedExtensions);
        });
    });

    it('supports var args', () => {
      const query = FileHound.create()
        .ext('.txt', 'json')
        .paths(fixtureDir + '/ext')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files, mixedExtensions);
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

    it('returns files for given match names', () => {
      const query = FileHound.create()
        .match(['*b.json', '*bcc.json'])
        .paths(fixtureDir + '/mixed')
        .find();

      return query
        .then((files) => {
          assert.deepEqual(files.sort(), matchFiles);
        });
    });

    describe('.glob', () => {
      it('returns files using glob method with a single glob', () => {
        const query = FileHound.create()
          .glob('*ab*.json')
          .paths(fixtureDir + '/mixed')
          .find();

        return query
          .then((files) => {
            assert.deepEqual(files.sort(), matchFiles);
          });
      });

      it('returns files using glob method with multiple globs', () => {
        const matchingFiles = qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json', '/mixed/acdc.json']);
        const query = FileHound.create()
          .glob(['*ab*.json', '*cd*.json'])
          .paths(fixtureDir + '/mixed')
          .find();

        return query
          .then((files) => {
            assert.deepEqual(files.sort(), matchingFiles);
          });
      });

      it('returns files using glob method with variable args', () => {
        const matchingFiles = qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json', '/mixed/acdc.json', '/mixed/z.json']);
        const query = FileHound.create()
          .glob('*ab*.json', '*cd*.json', '*z*')
          .paths(fixtureDir + '/mixed')
          .find();

        return query
          .then((files) => {
            assert.deepEqual(files.sort(), matchingFiles);
          });
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

    it('returns files using file size units', () => {
      const sizeLessThan15bytes = FileHound.create()
        .size('<15b')
        .paths(fixtureDir + '/sizes')
        .find();

      return sizeLessThan15bytes
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

  describe('.ignoreHiddenFiles()', () => {
    it('ignores hidden files', () => {
      const noHiddenFiles = FileHound.create()
        .ignoreHiddenFiles()
        .paths(fixtureDir + '/visibility')
        .find();

      noHiddenFiles.then((files) => {
        assert.equal(files.length, 2);
        assert.deepEqual(files, qualifyNames(['/visibility/.hidden/visible.json', '/visibility/visible.json']));
      });
    });

    it('ignores files within hidden directories', () => {
      const noHiddenFiles = FileHound.create()
        .ignoreHiddenDirectories()
        .ignoreHiddenFiles()
        .paths(fixtureDir + '/visibility')
        .find();

      noHiddenFiles.then((files) => {
        assert.equal(files.length, 1);
        assert.deepEqual(files, qualifyNames(['/visibility/visible.json']));
      });
    });
  });

  describe('.addFilter', () => {
    it('returns files based on a custom filter', () => {
      const customFilter = FileHound.create()
        .addFilter((file) => {
          return file.sizeSync() === 1024;
        })
        .paths(fixtureDir + '/custom')
        .find();

      return customFilter
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/custom/passed.txt']));
        });
    });
  });

  describe('.modified', () => {
    before(() => {
      fs.mkdirSync(getAbsolutePath('dates'));
    });

    after(() => {
      fs.rmdirSync(getAbsolutePath('dates'));
    });

    const files = [
      {
        name: getAbsolutePath('dates/a.txt'),
        modified: 10
      },
      {
        name: getAbsolutePath('dates/w.txt'),
        modified: 9
      },
      {
        name: getAbsolutePath('dates/x.txt'),
        modified: 2
      },
      {
        name: getAbsolutePath('dates/y.txt'),
        modified: 1
      },
      {
        name: getAbsolutePath('dates/z.txt'),
        modified: 0
      }
    ];

    beforeEach(() => {
      files.forEach((file) => {
        createFile(file.name, {
          duration: file.modified,
          modifier: 'days'
        });
      });
    });

    afterEach(() => {
      files.forEach((file) => {
        deleteFile(file.name);
      });
    });

    it('returns files modified exactly n days', () => {
      const modifiedNDaysAgo = FileHound.create()
        .paths(fixtureDir + '/dates')
        .modified(10)
        .find();

      return modifiedNDaysAgo
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/a.txt']));
        });
    });

    it('returns files greater than n days', () => {
      const modifiedNDaysAgo = FileHound.create()
        .paths(fixtureDir + '/dates')
        .modified('>2 days')
        .find();

      return modifiedNDaysAgo
        .then((files) => {
          assert.deepEqual(files,
            qualifyNames([
              '/dates/a.txt',
              '/dates/w.txt'
            ]));
        });
    });

    it('returns files less than n days', () => {
      const modifiedNDaysAgo = FileHound.create()
        .paths(fixtureDir + '/dates')
        .modified('<10 days')
        .find();

      return modifiedNDaysAgo
        .then((files) => {
          assert.deepEqual(files,
            qualifyNames([
              '/dates/w.txt',
              '/dates/x.txt',
              '/dates/y.txt',
              '/dates/z.txt'
            ]));
        });
    });
  });

  describe('.accessed', () => {
    before(() => {
      fs.mkdirSync(getAbsolutePath('dates'));
    });

    after(() => {
      fs.rmdirSync(getAbsolutePath('dates'));
    });

    const files = [
      {
        name: getAbsolutePath('dates/a.txt'),
        accessed: 10
      },
      {
        name: getAbsolutePath('dates/w.txt'),
        accessed: 9
      },
      {
        name: getAbsolutePath('dates/x.txt'),
        accessed: 2
      },
      {
        name: getAbsolutePath('dates/y.txt'),
        accessed: 1
      },
      {
        name: getAbsolutePath('dates/z.txt'),
        accessed: 0
      }
    ];

    beforeEach(() => {
      files.forEach((file) => {
        createFile(file.name, {
          duration: file.accessed,
          modifier: 'hours'
        });
      });
    });

    afterEach(() => {
      files.forEach((file) => {
        deleteFile(file.name);
      });
    });

    it('returns files accessed > 8 hours ago', () => {
      const accessedFiles = FileHound.create()
        .paths(fixtureDir + '/dates')
        .accessed('>8h')
        .find();

      return accessedFiles
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
        });
    });

    it('returns files accessed < 3 hours ago', () => {
      const accessedFiles = FileHound.create()
        .paths(fixtureDir + '/dates')
        .accessed('<3h')
        .find();

      return accessedFiles
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt']));
        });
    });

    it('returns files accessed 1 hour ago', () => {
      const accessedFiles = FileHound.create()
        .paths(fixtureDir + '/dates')
        .accessed('=1h')
        .find();

      return accessedFiles
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/y.txt']));
        });
    });
  });

  describe('.changed', () => {
    const sandbox = sinon.createSandbox();
    let statSync;

    before(() => {
      fs.mkdirSync(getAbsolutePath('dates'));

      statSync = sandbox.stub(fs, 'statSync');
      statSync.returns({
        isDirectory: function () {
          return true;
        }
      });
    });

    after(() => {
      fs.rmdirSync(getAbsolutePath('dates'));
      sandbox.restore();
    });

    const files = [
      {
        name: getAbsolutePath('dates/a.txt'),
        changed: 10
      },
      {
        name: getAbsolutePath('dates/w.txt'),
        changed: 9
      },
      {
        name: getAbsolutePath('dates/x.txt'),
        changed: 2
      },
      {
        name: getAbsolutePath('dates/y.txt'),
        changed: 1
      },
      {
        name: getAbsolutePath('dates/z.txt'),
        changed: 0
      }
    ];

    beforeEach(() => {
      files.forEach((file) => {
        createFile(file.name, {
          duration: file.changed,
          modifier: 'hours'
        });

        statSync.withArgs(file.name).returns({
          ctime: moment().subtract(file.changed, 'hours'),
          isDirectory: function () {
            return false;
          }
        });
      });
    });

    afterEach(() => {
      files.forEach((file) => {
        deleteFile(file.name);
      });
    });

    it('returns files changed > 8 hours ago', () => {
      const changedFiles = FileHound.create()
        .paths(fixtureDir + '/dates')
        .changed('>8h')
        .find();

      return changedFiles
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
        });
    });

    it('returns files changed < 3 hours ago', () => {
      const changedFiles = FileHound.create()
        .paths(fixtureDir + '/dates')
        .changed('<3h')
        .find();

      return changedFiles
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt']));
        });
    });

    it('returns files changed 1 hour ago', () => {
      const changedFiles = FileHound.create()
        .paths(fixtureDir + '/dates')
        .changed('=1h')
        .find();

      return changedFiles
        .then((files) => {
          assert.deepEqual(files, qualifyNames(['/dates/y.txt']));
        });
    });
  });

  it('emits a match event for each file matched', () => {
    const fh = FileHound.create();
    fh.path(fixtureDir + '/justFiles');

    const spy = sinon.spy();
    fh.on('match', spy);

    const query = fh.find();

    return query
      .then(() => {
        sinon.assert.callCount(spy, 3);
        sinon.assert.calledWithMatch(spy, 'dummy.txt');
        sinon.assert.calledWithMatch(spy, 'a.json');
        sinon.assert.calledWithMatch(spy, 'b.json');
      });
  });

  it('emits an end event when the search is complete', () => {
    const fh = FileHound.create();
    fh.path(fixtureDir + '/justFiles');

    const spy = sinon.spy();
    fh.on('end', spy);

    const query = fh.find();

    return query
      .then(() => {
        sinon.assert.callCount(spy, 1);
      });
  });

  it('emits an error event', () => {
    const fh = FileHound.create();
    fh.path(fixtureDir + '/justBad');

    const spy = sinon.spy();
    fh.on('error', spy);

    const query = fh.find();

    return query
      .catch((e) => {
        assert.ok(e);
        sinon.assert.callCount(spy, 1);
      });
  });

  it('ignores errors thrown for invalid symlinks', () => {
    const target = getAbsolutePath('broken.txt');
    const path = getAbsolutePath('brokenLink');
    fs.symlinkSync(target, path);

    const pending = FileHound.create()
      .paths(fixtureDir)
      .ext('java')
      .find();

    return pending
      .then((files) => {
        assert.equal(files.length, 1);
      })
      .catch((err) => {
        assert.fail(null, null, `Unexpected exception raised: ${err}`);
      })
      .finally(() => {
        fs.unlinkSync(path);
      });
  });
});
