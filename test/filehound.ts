import {assert} from 'chai';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import * as sinon from 'sinon';
import {FileHound} from '../src/filehound';
import * as Files from '../src/files';
import {
  accessed,
  changed,
  customFilter,
  directories,
  discard2,
  ext,
  glob,
  ignoreHiddenFiles,
  ignoreHiddenPath,
  isEmpty,
  modified,
  size,
  socket
} from '../src/matchers';

const justFiles = qualifyNames([
  '/justFiles/a.json',
  '/justFiles/b.json',
  '/justFiles/dummy.txt'
]);
const nestedFiles = qualifyNames([
  '/nested/.hidden1/bad.txt',
  '/nested/c.json',
  'nested/d.json',
  '/nested/mydir/e.json'
]);
const textFiles = qualifyNames(['/justFiles/dummy.txt']);
const mixedExtensions = qualifyNames(['/ext/dummy.json', '/ext/dummy.txt']);
const matchFiles = qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json']);
const sandbox = sinon.sandbox.create();

function getAbsolutePath(file: string): string {
  return path.join(`${__dirname}/fixtures/`, file);
}

function qualifyNames(names: string[]): string[] {
  return names.map(getAbsolutePath);
}

function createFile(fname: string, opts: any): void {
  const time = new Date(moment()
    .subtract(opts.duration, opts.modifier)
    .format());

  const fd = fs.openSync(fname, 'w+');
  fs.futimesSync(fd, time, time);
  fs.closeSync(fd);
}

function deleteFile(fname: fs.PathLike): void {
  fs.unlinkSync(fname);
}

describe('FileHound', async () => {
  const fixtureDir = `${__dirname}/fixtures`;

  describe('Matchers', async () => {
    describe('.ext', () => {
      it('returns files for a given ext', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/justFiles`)
          .match(ext('.txt'))
          .find();

        assert.deepEqual(results, textFiles);
      });

      it('returns files for a given ext including a period', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/justFiles`)
          .match(
            ext('.txt')
          )
          .find();

        assert.deepEqual(results, textFiles);
      });

      it('returns files for all matching extensions', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/ext`)
          .match(ext(['txt', '.json']))
          .find();

        assert.deepEqual(results, mixedExtensions);
      });

      it('supports var args', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/ext`)
          .match(
            ext('.txt', 'json')
          )
          .find();

        assert.deepEqual(results, mixedExtensions);
      });
    });

    describe('.directory', () => {
      it('returns sub-directories of a given directory', async () => {
        const expectedDirectories = qualifyNames([
          '/deeplyNested/mydir',
          '/deeplyNested/mydir/mydir2',
          '/deeplyNested/mydir/mydir2/mydir3',
          '/deeplyNested/mydir/mydir2/mydir3/mydir4'
        ]);

        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/deeplyNested`)
          .match(directories().and(glob('*mydir4*')))
          .find();

        assert.deepEqual(results, expectedDirectories);
      });

      it('includes hidden directories by default', async () => {
        const expectedDirectories = qualifyNames([
          '/deeplyNestedWithHiddenDir/mydir',
          '/deeplyNestedWithHiddenDir/mydir/mydir2',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3/mydir4',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3/mydir4/.mydir5'
        ]);

        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/deeplyNestedWithHiddenDir`)
          .match(
            directories()
          )
          .find();

        assert.deepEqual(results, expectedDirectories);
      });

      it('ignores hidden directories', async () => {
        const expectedDirectories = qualifyNames([
          '/deeplyNestedWithHiddenDir/mydir',
          '/deeplyNestedWithHiddenDir/mydir/mydir2',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3',
          '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3/mydir4'
        ]);

        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/deeplyNestedWithHiddenDir`)
          .match(
            directories({excludeHidden: true})
          )
          .find();

        assert.deepEqual(results, expectedDirectories);
      });

      it('filters matching directories', async () => {
        const expectedDirectories = qualifyNames([
          '/deeplyNested/mydir',
          '/deeplyNested/mydir/mydir2',
          '/deeplyNested/mydir/mydir2/mydir3'
        ]);

        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/deeplyNested`)
          .match(
            directories(),
            glob('*dir4*')
              .not()
          )
          .find();

        assert.deepEqual(results, expectedDirectories);
      });
    });

    describe('.glob', () => {
      it('returns files for given glob pattern', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/mixed`)
          .match(
            glob('*ab*.json')
          )
          .find();

        assert.deepEqual(results.sort(), matchFiles);
      });

      it('performs recursive search using matching on a given pattern', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/nested`)
          .match(
            glob('*.json')
          )
          .find();

        const expected = nestedFiles.filter(f => /\.json$/.test(f));

        assert.deepEqual(results.sort(), expected);
      });
    });

    describe('.discard', () => {
      it('ignores paths matching a given pattern', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/nested`)
          .match(
            discard2('mydir')
          )
          .find();

        const expected = nestedFiles.filter(f => !/mydir/.test(f));
        assert.deepEqual(results, expected);
      });

      it('ignores files', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/nested`)
          .match(
            discard2('c.json')
          )
          .find();

        const expected = nestedFiles.filter(f => !/c.json/.test(f));
        assert.deepEqual(results, expected);
      });

      it('ignores everything using a greedy _match', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/nested`)
          .match(
            discard2('.*')
          )
          .find();

        assert.deepEqual(results, []);
      });

      it('matches all files after being negated', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/nested`)
          .match(
            discard2('.*').not()
          )
          .find();

        assert.deepEqual(results, nestedFiles);
      });

      it('applies multiple discard filters as variable arguments', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/mixed`)
          .match(
            discard2('a.json', 'z.json')
          )
          .find();

        assert.deepEqual(
          results,
          qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json'])
        );
      });

      it('applies an array of discard filters', async () => {
        const results = await FileHound.newQuery()
          .paths(`${fixtureDir}/mixed`)
          .match(
            discard2(...['a.json', 'z.json'])
          )
          .find();

        assert.deepEqual(
          results,
          qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json'])
        );
      });
    });

    describe('.size', () => {
      it('returns files matched using the equality operator by default', async () => {
        const sizeFile10Bytes = await FileHound.newQuery()
          .paths(`${fixtureDir}/justFiles`)
          .match(
            size(20)
          )
          .find();

        assert.deepEqual(sizeFile10Bytes, qualifyNames(['/justFiles/b.json']));
      });

      it('returns files that equal a given number of bytes', async () => {
        const sizeFile10Bytes = await FileHound.newQuery()
          .paths(`${fixtureDir}/justFiles`)
          .match(
            size('==20')
          )
          .find();

        assert.deepEqual(sizeFile10Bytes, qualifyNames(['/justFiles/b.json']));
      });

      it('returns files greater than a given size', async () => {
        const sizeGreaterThan1k = await FileHound.newQuery()
          .paths(`${fixtureDir}/sizes`)
          .match(size('>1024'))
          .find();

        assert.deepEqual(sizeGreaterThan1k, qualifyNames(['/sizes/2k.txt']));
      });

      it('returns files less than a given size', async () => {
        const sizeLessThan1k = await FileHound.newQuery()
          .paths(`${fixtureDir}/sizes`)
          .match(size('<1024'))
          .find();

        assert.deepEqual(
          sizeLessThan1k,
          qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt'])
        );
      });

      it('returns files using file size units', async () => {
        const sizeLessThan15bytes = await FileHound.newQuery()
          .paths(`${fixtureDir}/sizes`)
          .match(
            size('<15b')
          )
          .find();

        assert.deepEqual(
          sizeLessThan15bytes,
          qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt'])
        );
      });

      it('returns files less than or equal to a given size', async () => {
        const lessThanOrEqualTo1k = await FileHound.newQuery()
          .paths(`${fixtureDir}/sizes`)
          .match(
            size('<=1024')
          )
          .find();

        assert.deepEqual(
          lessThanOrEqualTo1k,
          qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt', '/sizes/1k.txt'])
        );
      });

      it('returns files greater than or equal to a given size', async () => {
        const greaterThanOrEqualTo1k = await FileHound.newQuery()
          .paths(`${fixtureDir}/sizes`)
          .match(
            size('>=1024')
          )
          .find();

        assert.deepEqual(
          greaterThanOrEqualTo1k,
          qualifyNames(['/sizes/1k.txt', '/sizes/2k.txt'])
        );
      });

      it('returns files within a given size range', async () => {
        const range = await FileHound.newQuery()
          .paths(`${fixtureDir}/sizes`)
          .match(
            size('>0').and(size('<=1024'))
          )
          .find();

        assert.deepEqual(
          range,
          qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt', '/sizes/1k.txt'])
        );
      });
    });

    describe('.isEmpty()', () => {
      it('returns zero length files', async () => {
        const allEmpty = await FileHound.newQuery()
          .paths(`${fixtureDir}/justFiles`)
          .match(
            isEmpty()
          )
          .find();

        assert.deepEqual(
          allEmpty,
          qualifyNames(['/justFiles/a.json', '/justFiles/dummy.txt'])
        );
      });
    });

    describe('.socket', async () => {
      const file = {
        isSocket: () => {
          return true;
        },
        isSocketSync: () => {
          return true;
        },
        isDirectorySync: () => {
          return false;
        },
        isDirectory: () => {
          return Promise.resolve(false);
        },
        isFile: async () => {
          return true;
        },
        getName: () => {
          return getAbsolutePath('/types/socket1');
        }
      };
      const root = {
        isDirectorySync: () => {
          return true;
        },
        isDirectory: async () => {
          return true;
        },
        getDepthSync: () => {
          return 0;
        },
        getName: () => {
          return getAbsolutePath('/types/socket1');
        },
        getFiles: () => {
          return Promise.resolve()
            .then(() => {
              return [file];
            });
        }
      };

      beforeEach(() => {
        sandbox.stub(Files, 'newFile').returns(root);
        sandbox.stub(fs, 'existsSync').returns(true);
      });

      afterEach(() => {
        sandbox.restore();
      });

      it('filters by socket type files', async () => {
        const sockets = await FileHound.newQuery()
          .paths(`${fixtureDir}/types`)
          .match(
            socket()
          )
          .find();

        assert.deepEqual(sockets, [file.getName()]);
      });
    });
  });

  describe('.depth', () => {
    it('only returns files in the current directory', () => {
      const query = FileHound.newQuery()
        .paths(`${fixtureDir}/deeplyNested`)
        .depth(0)
        .find();

      return query.then((files) => {
        assert.deepEqual(
          files,
          qualifyNames(['/deeplyNested/c.json', 'deeplyNested/d.json'])
        );
      });
    });

    it('only returns files one level deep', () => {
      const query = FileHound.newQuery()
        .paths(`${fixtureDir}/deeplyNested`)
        .depth(1)
        .find();

      return query.then((files) => {
        assert.deepEqual(
          files,
          qualifyNames([
            '/deeplyNested/c.json',
            'deeplyNested/d.json',
            'deeplyNested/mydir/e.json'
          ])
        );
      });
    });

    it('returns files n level deep', async () => {
      const query = FileHound.newQuery()
        .paths(`${fixtureDir}/deeplyNested`)
        .depth(3)
        .find();

      const files = await query;
      files.sort();
      assert.deepEqual(files, qualifyNames([
          'deeplyNested/c.json',
          'deeplyNested/d.json',
          'deeplyNested/mydir/e.json',
          'deeplyNested/mydir/mydir2/f.json',
          'deeplyNested/mydir/mydir2/mydir3/z.json',
          'deeplyNested/mydir/mydir2/y.json'
        ])
      );
    });

    it('returns files n level deep relative to path', async () => {
      const files = await FileHound.newQuery()
        .paths(`${fixtureDir}/deeplyNested`, `${fixtureDir}//deeplyNested/mydir`)
        .depth(0)
        .find();

      files.sort();
      assert.deepEqual(
        files,
        qualifyNames([
          'deeplyNested/c.json',
          'deeplyNested/d.json',
          'deeplyNested/mydir/e.json'
        ])
      );
    });
  });

  describe('.paths', () => {
    it('returns all files in a given directory', async () => {
      const files = await FileHound.newQuery()
        .paths(`${fixtureDir}/justFiles`)
        .find();

      assert.deepEqual(files, justFiles);
    });

    it('returns files performing a recursive search', async () => {
      const files = await FileHound.newQuery()
        .paths(`${fixtureDir}/nested`)
        .find();

      assert.deepEqual(files, nestedFiles);
    });

    it('returns matching files from multiple search paths', async () => {
      const location1 = `${fixtureDir}/nested`;
      const location2 = `${fixtureDir}/justFiles`;

      const files = await FileHound.newQuery()
        .paths(location1, location2)
        .find();

      const expected = nestedFiles.concat(justFiles).sort();
      assert.deepEqual(files, expected);
    });

    it('returns matching files given a array of paths', async () => {
      const location1 = `${fixtureDir}/nested`;
      const location2 = `${fixtureDir}/justFiles`;

      const files = await FileHound.newQuery()
        .paths(...[location1, location2])
        .find();

      const expected = nestedFiles.concat(justFiles).sort();
      assert.deepEqual(files, expected);
    });

    it('removes duplicate paths', async () => {
      const location1 = `${fixtureDir}/nested`;

      const fh = await FileHound.newQuery();
      fh.paths(location1, location1);

      assert.deepEqual(fh.getSearchPaths(), [location1]);
    });

    it('returns a defensive copy of the search directories', async () => {
      const fh = await FileHound.newQuery();
      fh.paths('a', 'b', 'c');
      const tempDirectory = fh.getSearchPaths();
      tempDirectory.push('d');

      assert.equal(fh.getSearchPaths().length, 3);
    });

    it('normalises paths', async () => {
      const location1 = `${fixtureDir}/nested`;
      const location2 = `${fixtureDir}/nested/mydir`;
      const location3 = `${fixtureDir}/justFiles/moreFiles`;
      const location4 = `${fixtureDir}/justFiles`;

      const fh = await FileHound.newQuery();
      fh.paths(location2, location1, location4, location3);

      assert.deepEqual(fh.getSearchPaths(), [location4, location1]);
    });
  });

  describe('.findSync', () => {
    it('returns an array of matching files', () => {
      const files = FileHound.newQuery()
        .paths(`${fixtureDir}/justFiles`)
        .findSync();

      assert.deepEqual(files, justFiles);
    });

    it('filters matching directories', () => {
      const expectedDirectories = qualifyNames([
        '/deeplyNested/mydir',
        '/deeplyNested/mydir/mydir2',
        '/deeplyNested/mydir/mydir2/mydir3'
      ]);

      const results = FileHound.newQuery()
        .paths(`${fixtureDir}/deeplyNested`)
        // .directory()
        // .match('*dir4*')
        // .not()
        .match(directories(), glob('*dir4*').not())
        .findSync();

      assert.deepEqual(results, expectedDirectories);
    });

    it('filters matching files', () => {
      const files = FileHound.newQuery()
        .paths(`${fixtureDir}/justFiles`)
        .match(ext('txt'))
        .findSync();

      assert.deepEqual(files, textFiles);
    });
  });

  describe('.any', () => {
    it('returns matching files for any query', async () => {
      const jsonStartingWithZ = FileHound.newQuery()
        .paths(`${fixtureDir}/justFiles`)
        .match(glob('*.json'));

      const onlyTextFles = FileHound.newQuery()
        .paths(`${fixtureDir}/justFiles`)
        .match(ext('txt'));

      const results = await FileHound.any(jsonStartingWithZ, onlyTextFles);

      assert.deepEqual(results, justFiles);
    });
  });

  describe('.ignoreHiddenFiles()', () => {
    it('ignores hidden files', async () => {
      const noHiddenFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/visibility`)
        .match(ignoreHiddenFiles())
        .find();

      assert.equal(noHiddenFiles.length, 2);
      assert.deepEqual(
        noHiddenFiles,
        qualifyNames([
          '/visibility/.hidden/visible.json',
          '/visibility/visible.json'
        ])
      );
    });

    it('ignores files within hidden directories', async () => {
      const noHiddenFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/visibility`)
        .match(
          ignoreHiddenPath()
        )
        .find();

      assert.equal(noHiddenFiles.length, 1);
      assert.deepEqual(noHiddenFiles, qualifyNames(['/visibility/visible.json']));
    });
  });

  describe('.addFilter', () => {
    it('returns files based on a custom filter', async () => {
      const files = await FileHound.newQuery()
        .match(customFilter((file) => {
          return file.sizeSync() === 1024;
        }))
        .paths(`${fixtureDir}/custom`)
        .find();

      assert.deepEqual(files, qualifyNames(['/custom/passed.txt']));
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

    it('returns files modified exactly n days', async () => {
      const modifiedNDaysAgo = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(modified(10))
        .find();

      assert.deepEqual(modifiedNDaysAgo, qualifyNames(['/dates/a.txt']));
    });

    it('returns files greater than n days', async () => {
      const modifiedNDaysAgo = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(modified('>2 days'))
        .find();

      assert.deepEqual(modifiedNDaysAgo, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
    });

    it('returns files less than n days', async () => {
      const modifiedNDaysAgo = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(modified('<10 days'))
        .find();

      assert.deepEqual(
        modifiedNDaysAgo,
        qualifyNames([
          '/dates/w.txt',
          '/dates/x.txt',
          '/dates/y.txt',
          '/dates/z.txt'
        ])
      );
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

    it('returns files accessed > 8 hours ago', async () => {
      const accessedFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(accessed('>8h'))
        .find();

      assert.deepEqual(accessedFiles, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
    });

    it('returns files accessed < 3 hours ago', async () => {
      const accessedFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(accessed('<3h'))
        .find();

      assert.deepEqual(
        accessedFiles,
        qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt'])
      );
    });

    it('returns files accessed 1 hour ago', async () => {
      const accessedFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(accessed('=1h'))
        .find();

      assert.deepEqual(accessedFiles, qualifyNames(['/dates/y.txt']));
    });
  });

  describe('.changed', () => {
    let statSync;

    before(() => {
      fs.mkdirSync(getAbsolutePath('dates'));

      statSync = sandbox.stub(fs, 'statSync');
      statSync.returns({
        isDirectory: () => {
          return true;
        },
        isFile: () => {
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

        statSync.withArgs(file.name)
          .returns({
            ctime: moment()
              .subtract(file.changed, 'hours'),
              isDirectory(): boolean {
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

    it('returns files changed > 8 hours ago', async () => {
      const changedFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(changed('>8h'))
        .find();

      assert.deepEqual(changedFiles, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
    });

    it('returns files changed < 3 hours ago', async () => {
      const changedFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(changed('<3h'))
        .find();

      assert.deepEqual(
        changedFiles,
        qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt'])
      );
    });

    it('returns files changed 1 hour ago', async () => {
      const changedFiles = await FileHound.newQuery()
        .paths(`${fixtureDir}/dates`)
        .match(changed('=1h'))
        .find();

      assert.deepEqual(changedFiles, qualifyNames(['/dates/y.txt']));
    });
  });

  it('emits a _match event for each file matched', async () => {
    const spy = sinon.spy();
    const fh = FileHound.newQuery();

    await fh.paths(`${fixtureDir}/justFiles`)
      .on('match', spy)
      .find();

    sinon.assert.callCount(spy, 3);
    sinon.assert.calledWithMatch(spy, 'dummy.txt');
    sinon.assert.calledWithMatch(spy, 'a.json');
    sinon.assert.calledWithMatch(spy, 'b.json');
  });

  it('emits an end event when the search is complete', async () => {
    const spy = sinon.spy();
    const fh = FileHound.newQuery();

    await fh.paths(`${fixtureDir}/justFiles`)
      .on('end', spy)
      .find();

    sinon.assert.callCount(spy, 1);
  });

  it('emits an error event', async () => {
    const fh = FileHound.newQuery();
    const spy = sinon.spy();

    try {
      await fh.paths(`${fixtureDir}/justBad`)
        .on('error', spy)
        .find();
    } catch (err) {
      assert.ok(err);
      return sinon.assert.callCount(spy, 1);
    }
    assert.fail('Expected to throw!');
  });
});
