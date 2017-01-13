import fs from 'fs';
import assert from 'assert';
import path from 'path';
import File from '../lib/file';
import moment from 'moment';
import sinon from 'sinon';

const sandbox = sinon.sandbox.create();

function getAbsolutePath(file) {
  return path.join(__dirname + '/fixtures/', file);
}

function qualifyNames(names) {
  return names.map(getAbsolutePath);
}

function formatDate(date) {
  return date.format('DD/MM/YYYY');
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

describe('File', () => {
  describe('.isDirectorySync', () => {
    it('returns true when a pathname is a directory', () => {
      const file = File.create(getAbsolutePath('/justFiles'));
      assert(file.isDirectorySync());
    });

    it('returns false when a pathname is not a directory', () => {
      const file = File.create(getAbsolutePath('/justFiles/a.json'));
      assert(!file.isDirectorySync());
    });
  });

  describe('.isDirectory', () => {
    it('returns true when a pathname is a directory', () => {
      const file = File.create(getAbsolutePath('/justFiles'));
      return file.isDirectory()
        .then((isDirectory) => {
          return assert(isDirectory);
        });
    });

    it('returns false when a pathname is not a directory', () => {
      const file = File.create(getAbsolutePath('/justFiles/a.json'));
      return file.isDirectory()
        .then((isDirectory) => {
          return assert(!isDirectory);
        });
    });
  });

  describe('.getFilesSync', () => {
    it('returns a list of files for a given directory', () => {
      const file = File.create(getAbsolutePath('/justFiles'));
      const files = file.getFilesSync();
      const expected = qualifyNames([
        'justFiles/a.json',
        'justFiles/b.json',
        'justFiles/dummy.txt'
      ]);

      assert.deepEqual(files, expected);
    });

    it('returns null when pathname is not a directory', () => {
      const file = File.create(getAbsolutePath('/justFiles/a.json'));
      const files = file.getFilesSync();
      assert.strictEqual(files, null);
    });
  });

  describe('.getFiles', () => {
    it('returns a list of files for a given directory', () => {
      const file = File.create(getAbsolutePath('/justFiles'));
      const files = file.getFiles();
      const expected = qualifyNames([
        'justFiles/a.json',
        'justFiles/b.json',
        'justFiles/dummy.txt'
      ]);

      return files
        .then((list) => {
          return assert.deepEqual(list, expected);
        });
    });

    it('returns null when pathname is not a directory', () => {
      const file = File.create(getAbsolutePath('/justFiles/a.json'));
      const files = file.getFiles();
      files.then((list) => {
        assert.strictEqual(list, null);
      });
    });
  });

  describe('.isHiddenSync(path)', () => {
    it('returns true when the file is hidden', () => {
      const hiddenPaths = [
        './test/fixtures/visibility/.hidden.json',
        './test/fixtures/visibility/.hidden/.hidden.json'
      ];
      hiddenPaths.forEach((path) => {
        const file = File.create(path);
        assert.strictEqual(file.isHiddenSync(), true);
      });
    });

    it('returns false when the file is visible', () => {
      const visiblePaths = [
        './test/fixtures/visibility/visible.json',
        './test/fixtures/visibility/.hidden/visible.json',
      ];
      visiblePaths.forEach((path) => {
        const file = File.create(path);
        assert.strictEqual(file.isHiddenSync(), false);
      });
    });
  });

  describe('.getDepthSync', () => {
    it('returns the depth of a directory', () => {
      const file = File.create('./test/fixtures/justFiles');
      assert.equal(file.getDepthSync(), 3);
    });

    it('returns the depth of a file', () => {
      const file = File.create('./test/fixtures/justFiles/a.json');
      assert.equal(file.getDepthSync(), 3);
    });
  });

  describe('.getPathExtension', () => {
    it('returns the extension for a file', () => {
      const file = File.create(getAbsolutePath('/justFiles/a.json'));
      assert.equal(file.getPathExtension(), 'json');
    });

    it('returns the extension for a directory', () => {
      const file = File.create(getAbsolutePath('/test.d'));
      assert.equal(file.getPathExtension(), 'd');
    });
  });

  describe('.glob', () => {
    it('returns true if the pathname is a match for a given glob', () => {
      const paths = [
        ['./test/fixtures/justFiles/a.json', '*.json'],
        ['./test/fixtures/justFiles', '*justFiles*']
      ];
      paths.forEach((testCase) => {
        const [pathname, glob] = testCase;
        const file = File.create(pathname);
        assert.strictEqual(file.isMatch(glob), true);
      });
    });

    it('returns false if the pathname is not a match for a given glob', () => {
      const paths = [
        ['./test/fixtures/justFiles/a.txt', '*.json'],
        ['./test/fixtures', '*justFiles*']
      ];
      paths.forEach((testCase) => {
        const [pathname, glob] = testCase;
        const file = File.create(pathname);
        assert.strictEqual(file.isMatch(glob), false);
      });
    });
  });

  describe('.lastModified', () => {
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

    it('returns the modified time of a given file', () => {
      files.forEach((file) => {
        const pathname = File.create(file.name);
        const actual = formatDate(moment(pathname.lastModifiedSync()));
        assert.equal(actual, formatDate(moment().subtract(file.modified, 'days')));
      });
    });

  });

  describe('.lastAccessed', () => {
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

    it('returns the accessed time of a given file', () => {
      files.forEach((file) => {
        const pathname = File.create(file.name);
        const actual = formatDate(moment(pathname.lastAccessedSync()));
        const expectedDate = formatDate(moment().subtract(file.accessed, 'hours'));
        assert.equal(actual, expectedDate);
      });
    });
  });

  describe('.lastChanged', () => {
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

    it('returns the last changed time of a given file', () => {
      files.forEach((file) => {
        const pathname = File.create(file.name);
        const actual = formatDate(moment(pathname.lastChangedSync()));
        const expectedDate = formatDate(moment().subtract(file.changed, 'hours'));
        assert.equal(actual, expectedDate);
      });
    });
  });

  describe('.size', () => {
    it('returns the size of a pathname in bytes', () => {
      const pathname = File.create(getAbsolutePath('sizes/10b.txt'));
      assert.equal(pathname.sizeSync(), 10);
    });
  });
});
