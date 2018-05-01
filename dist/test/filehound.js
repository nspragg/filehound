"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const sinon = require("sinon");
const File = require("file-js");
const bluebird = require("bluebird");
const filehound_1 = require("../src/filehound");
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
function getAbsolutePath(file) {
    return path.join(__dirname + '/fixtures/', file);
}
function qualifyNames(names) {
    return names.map(getAbsolutePath);
}
function createFile(fname, opts) {
    const time = new Date(moment()
        .subtract(opts.duration, opts.modifier)
        .format());
    const fd = fs.openSync(fname, 'w+');
    fs.futimesSync(fd, time, time);
    fs.closeSync(fd);
}
function deleteFile(fname) {
    return fs.unlinkSync(fname);
}
describe('FileHound', () => __awaiter(this, void 0, void 0, function* () {
    const fixtureDir = __dirname + '/fixtures';
    describe('.socket', () => __awaiter(this, void 0, void 0, function* () {
        const file = {
            isSocket: () => {
                return true;
            },
            isDirectorySync: () => {
                return false;
            },
            isDirectory: () => {
                return bluebird.resolve(false);
            },
            getName: () => {
                return getAbsolutePath('/types/socket1');
            }
        };
        beforeEach(() => {
            const root = {
                isDirectorySync: () => {
                    return true;
                },
                isDirectory: () => __awaiter(this, void 0, void 0, function* () {
                    return true;
                }),
                getDepthSync: () => {
                    return 0;
                },
                getFiles: () => {
                    return bluebird.resolve()
                        .then(() => {
                        return [file];
                    });
                }
            };
            sandbox.stub(File, 'create')
                .returns(root);
        });
        afterEach(() => {
            sandbox.restore();
        });
        it('filters by socket type files', () => __awaiter(this, void 0, void 0, function* () {
            const sockets = yield filehound_1.default.create()
                .paths(fixtureDir + '/types')
                .socket()
                .find();
            chai_1.assert.deepEqual(sockets, [file.getName()]);
        }));
    }));
    describe('.directory', () => {
        it('returns sub-directories of a given directory', () => {
            const expectedDirectories = qualifyNames([
                '/deeplyNested/mydir',
                '/deeplyNested/mydir/mydir2',
                '/deeplyNested/mydir/mydir2/mydir3',
                '/deeplyNested/mydir/mydir2/mydir3/mydir4'
            ]);
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested')
                .directory()
                .find();
            return query.then((directories) => {
                chai_1.assert.deepEqual(directories, expectedDirectories);
            });
        });
        it('ignores hidden directories', () => {
            const expectedDirectories = qualifyNames([
                '/deeplyNestedWithHiddenDir/mydir',
                '/deeplyNestedWithHiddenDir/mydir/mydir2',
                '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3',
                '/deeplyNestedWithHiddenDir/mydir/mydir2/mydir3/mydir4'
            ]);
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNestedWithHiddenDir')
                .directory()
                .ignoreHiddenDirectories()
                .find();
            return query.then((directories) => {
                chai_1.assert.deepEqual(directories, expectedDirectories);
            });
        });
        it('filters matching directories', () => {
            const expectedDirectories = qualifyNames([
                '/deeplyNested/mydir',
                '/deeplyNested/mydir/mydir2',
                '/deeplyNested/mydir/mydir2/mydir3'
            ]);
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested')
                .directory()
                .match('*dir4*')
                .not()
                .find();
            return query.then((directories) => {
                chai_1.assert.deepEqual(directories, expectedDirectories);
            });
        });
    });
    describe('.depth', () => {
        it('only returns files in the current directory', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested')
                .depth(0)
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/deeplyNested/c.json', 'deeplyNested/d.json']));
            });
        });
        it('only returns files one level deep', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested')
                .depth(1)
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames([
                    '/deeplyNested/c.json',
                    'deeplyNested/d.json',
                    'deeplyNested/mydir/e.json'
                ]));
            });
        });
        it('returns files n level deep', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested')
                .depth(3)
                .find();
            return query.then((files) => {
                files.sort();
                chai_1.assert.deepEqual(files, qualifyNames([
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
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested', fixtureDir + '/deeplyNested/mydir')
                .depth(0)
                .find();
            return query.then((files) => {
                files.sort();
                chai_1.assert.deepEqual(files, qualifyNames([
                    'deeplyNested/c.json',
                    'deeplyNested/d.json',
                    'deeplyNested/mydir/e.json'
                ]));
            });
        });
    });
    describe('.path', () => {
        it('returns all files in a given directory', () => {
            const query = filehound_1.default.create()
                .path(fixtureDir + '/justFiles')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, justFiles);
            });
        });
        it('ignores all paths except the first', () => {
            const location1 = fixtureDir + '/justFiles';
            const query = filehound_1.default.create()
                .path(location1)
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, justFiles);
            });
        });
        it('returns an error when a given path is invalid', () => {
            const badLocation = fixtureDir + '/justBad';
            const query = filehound_1.default.create()
                .path(badLocation)
                .find();
            return query.catch((err) => {
                chai_1.assert.ok(err);
            });
        });
    });
    describe('.paths', () => {
        it('returns all files in a given directory', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/justFiles')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, justFiles);
            });
        });
        it('returns files performing a recursive search', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/nested')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, nestedFiles);
            });
        });
        it('returns matching files from multiple search paths', () => {
            const location1 = fixtureDir + '/nested';
            const location2 = fixtureDir + '/justFiles';
            const query = filehound_1.default.create()
                .paths(location1, location2)
                .find();
            return query.then((files) => {
                const expected = nestedFiles.concat(justFiles)
                    .sort();
                chai_1.assert.deepEqual(files, expected);
            });
        });
        it('returns matching files given a array of paths', () => {
            const location1 = fixtureDir + '/nested';
            const location2 = fixtureDir + '/justFiles';
            const query = filehound_1.default.create()
                .paths([location1, location2])
                .find();
            return query.then((files) => {
                const expected = nestedFiles.concat(justFiles)
                    .sort();
                chai_1.assert.deepEqual(files, expected);
            });
        });
        it('removes duplicate paths', () => {
            const location1 = fixtureDir + '/nested';
            const fh = filehound_1.default.create();
            fh.paths(location1, location1);
            chai_1.assert.deepEqual(fh.getSearchPaths(), [location1]);
        });
        it('returns a defensive copy of the search directories', () => {
            const fh = filehound_1.default.create();
            fh.paths('a', 'b', 'c');
            const directories = fh.getSearchPaths();
            directories.push('d');
            chai_1.assert.equal(fh.getSearchPaths().length, 3);
        });
        it('normalises paths', () => {
            const location1 = fixtureDir + '/nested';
            const location2 = fixtureDir + '/nested/mydir';
            const location3 = fixtureDir + '/justFiles/moreFiles';
            const location4 = fixtureDir + '/justFiles';
            const fh = filehound_1.default.create();
            fh.paths(location2, location1, location4, location3);
            chai_1.assert.deepEqual(fh.getSearchPaths(), [location4, location1]);
        });
    });
    describe('.discard', () => {
        it('ignores matching sub-directories', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/nested')
                .discard('mydir')
                .find();
            const expected = nestedFiles.filter(f => !/mydir/.test(f));
            return query.then((files) => {
                chai_1.assert.deepEqual(files, expected);
            });
        });
        it('ignores files', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/nested')
                .discard('c.json')
                .find();
            const expected = nestedFiles.filter(f => !/c.json/.test(f));
            return query.then((files) => {
                chai_1.assert.deepEqual(files, expected);
            });
        });
        it('ignores everything using a greedy match', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/nested')
                .discard('.*')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, []);
            });
        });
        it('matches all files after being negated', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/nested')
                .discard('.*')
                .not()
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, nestedFiles);
            });
        });
        it('applies multiple discard filters as variable aruments', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/mixed')
                .discard('a.json', 'z.json')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json']));
            });
        });
        it('applies an array of discard filters', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/mixed')
                .discard(['a.json', 'z.json'])
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json']));
            });
        });
    });
    describe('.findSync', () => {
        it('returns an array of matching files', () => {
            const files = filehound_1.default.create()
                .paths(fixtureDir + '/justFiles')
                .findSync();
            chai_1.assert.deepEqual(files, justFiles);
        });
        it('filters matching directories', () => {
            const expectedDirectories = qualifyNames([
                '/deeplyNested/mydir',
                '/deeplyNested/mydir/mydir2',
                '/deeplyNested/mydir/mydir2/mydir3'
            ]);
            const directories = filehound_1.default.create()
                .paths(fixtureDir + '/deeplyNested')
                .directory()
                .match('*dir4*')
                .not()
                .findSync();
            chai_1.assert.deepEqual(directories, expectedDirectories);
        });
        it('filters matching files', () => {
            const files = filehound_1.default.create()
                .paths(fixtureDir + '/justFiles')
                .ext('txt')
                .findSync();
            chai_1.assert.deepEqual(files, textFiles);
        });
    });
    describe('.ext', () => {
        it('returns files for a given ext', () => {
            const query = filehound_1.default.create()
                .ext('txt')
                .paths(fixtureDir + '/justFiles')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, textFiles);
            });
        });
        it('returns files for a given ext including a period', () => {
            const query = filehound_1.default.create()
                .ext('.txt')
                .paths(fixtureDir + '/justFiles')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, textFiles);
            });
        });
        it('returns files for all matching extensions', () => {
            const query = filehound_1.default.create()
                .ext(['txt', '.json'])
                .paths(fixtureDir + '/ext')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, mixedExtensions);
            });
        });
        it('supports var args', () => {
            const query = filehound_1.default.create()
                .ext('.txt', 'json')
                .paths(fixtureDir + '/ext')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files, mixedExtensions);
            });
        });
    });
    describe('.match', () => {
        it('returns files for given match name', () => {
            const query = filehound_1.default.create()
                .match('*ab*.json')
                .paths(fixtureDir + '/mixed')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files.sort(), matchFiles);
            });
        });
        it('returns files using glob method', () => {
            const query = filehound_1.default.create()
                .glob('*ab*.json')
                .paths(fixtureDir + '/mixed')
                .find();
            return query.then((files) => {
                chai_1.assert.deepEqual(files.sort(), matchFiles);
            });
        });
        it('performs recursive search using matching on a given pattern', () => {
            const query = filehound_1.default.create()
                .paths(fixtureDir + '/nested')
                .match('*.json')
                .find();
            const expected = nestedFiles.filter(f => /\.json$/.test(f));
            return query.then((files) => {
                chai_1.assert.deepEqual(files.sort(), expected);
            });
        });
    });
    describe('.not', () => {
        it('returns files not matching the given query', () => {
            const notJsonStartingWithZ = filehound_1.default.create()
                .match('*.json')
                .paths(fixtureDir + '/justFiles')
                .not()
                .find();
            return notJsonStartingWithZ.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/justFiles/dummy.txt']));
            });
        });
    });
    describe('.any', () => {
        it('returns matching files for any query', () => {
            const jsonStartingWithZ = filehound_1.default.create()
                .match('*.json')
                .paths(fixtureDir + '/justFiles');
            // .find();
            const onlyTextFles = filehound_1.default.create()
                .ext('txt')
                .paths(fixtureDir + '/justFiles');
            // .find();
            const results = filehound_1.default.any(jsonStartingWithZ, onlyTextFles);
            return results.then((files) => {
                chai_1.assert.deepEqual(files, justFiles);
            });
        });
    });
    describe('.size', () => {
        it('returns files matched using the equality operator by default', () => {
            const sizeFile10Bytes = filehound_1.default.create()
                .size(20)
                .paths(fixtureDir + '/justFiles')
                .find();
            return sizeFile10Bytes.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/justFiles/b.json']));
            });
        });
        it('returns files that equal a given number of bytes', () => {
            const sizeFile10Bytes = filehound_1.default.create()
                .size('==20')
                .paths(fixtureDir + '/justFiles')
                .find();
            return sizeFile10Bytes.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/justFiles/b.json']));
            });
        });
        it('returns files greater than a given size', () => {
            const sizeGreaterThan1k = filehound_1.default.create()
                .size('>1024')
                .paths(fixtureDir + '/sizes')
                .find();
            return sizeGreaterThan1k.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/sizes/2k.txt']));
            });
        });
        it('returns files less than a given size', () => {
            const sizeLessThan1k = filehound_1.default.create()
                .size('<1024')
                .paths(fixtureDir + '/sizes')
                .find();
            return sizeLessThan1k.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt']));
            });
        });
        it('returns files using file size units', () => {
            const sizeLessThan15bytes = filehound_1.default.create()
                .size('<15b')
                .paths(fixtureDir + '/sizes')
                .find();
            return sizeLessThan15bytes.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt']));
            });
        });
        it('returns files less than or equal to a given size', () => {
            const lessThanOrEqualTo1k = filehound_1.default.create()
                .size('<=1024')
                .paths(fixtureDir + '/sizes')
                .find();
            return lessThanOrEqualTo1k.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt', '/sizes/1k.txt']));
            });
        });
        it('returns files greater than or equal to a given size', () => {
            const greaterThanOrEqualTo1k = filehound_1.default.create()
                .size('>=1024')
                .paths(fixtureDir + '/sizes')
                .find();
            return greaterThanOrEqualTo1k.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/sizes/1k.txt', '/sizes/2k.txt']));
            });
        });
        it('returns files within a given size range', () => {
            const range = filehound_1.default.create()
                .size('>0')
                .size('<=1024')
                .paths(fixtureDir + '/sizes')
                .find();
            return range.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt', '/sizes/1k.txt']));
            });
        });
    });
    describe('.isEmpty()', () => {
        it('returns zero length files', () => {
            const allEmpty = filehound_1.default.create()
                .isEmpty()
                .paths(fixtureDir + '/justFiles')
                .find();
            return allEmpty.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/justFiles/a.json', '/justFiles/dummy.txt']));
            });
        });
    });
    describe('.ignoreHiddenFiles()', () => {
        it('ignores hidden files', () => {
            const noHiddenFiles = filehound_1.default.create()
                .ignoreHiddenFiles()
                .paths(fixtureDir + '/visibility')
                .find();
            noHiddenFiles.then((files) => {
                chai_1.assert.equal(files.length, 2);
                chai_1.assert.deepEqual(files, qualifyNames([
                    '/visibility/.hidden/visible.json',
                    '/visibility/visible.json'
                ]));
            });
        });
        it('ignores files within hidden directories', () => {
            const noHiddenFiles = filehound_1.default.create()
                .ignoreHiddenDirectories()
                .ignoreHiddenFiles()
                .paths(fixtureDir + '/visibility')
                .find();
            noHiddenFiles.then((files) => {
                chai_1.assert.equal(files.length, 1);
                chai_1.assert.deepEqual(files, qualifyNames(['/visibility/visible.json']));
            });
        });
    });
    describe('.addFilter', () => {
        it('returns files based on a custom filter', () => {
            const customFilter = filehound_1.default.create()
                .addFilter((file) => {
                return file.sizeSync() === 1024;
            })
                .paths(fixtureDir + '/custom')
                .find();
            return customFilter.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/custom/passed.txt']));
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
            const modifiedNDaysAgo = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .modified(10)
                .find();
            return modifiedNDaysAgo.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/a.txt']));
            });
        });
        it('returns files greater than n days', () => {
            const modifiedNDaysAgo = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .modified('>2 days')
                .find();
            return modifiedNDaysAgo.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
            });
        });
        it('returns files less than n days', () => {
            const modifiedNDaysAgo = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .modified('<10 days')
                .find();
            return modifiedNDaysAgo.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames([
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
            const accessedFiles = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .accessed('>8h')
                .find();
            return accessedFiles.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
            });
        });
        it('returns files accessed < 3 hours ago', () => {
            const accessedFiles = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .accessed('<3h')
                .find();
            return accessedFiles.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt']));
            });
        });
        it('returns files accessed 1 hour ago', () => {
            const accessedFiles = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .accessed('=1h')
                .find();
            return accessedFiles.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/y.txt']));
            });
        });
    });
    describe('.changed', () => {
        const sandbox = sinon.sandbox.create();
        let statSync;
        before(() => {
            fs.mkdirSync(getAbsolutePath('dates'));
            statSync = sandbox.stub(fs, 'statSync');
            statSync.returns({
                isDirectory() {
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
                    isDirectory() {
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
            const changedFiles = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .changed('>8h')
                .find();
            return changedFiles.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
            });
        });
        it('returns files changed < 3 hours ago', () => {
            const changedFiles = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .changed('<3h')
                .find();
            return changedFiles.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt']));
            });
        });
        it('returns files changed 1 hour ago', () => {
            const changedFiles = filehound_1.default.create()
                .paths(fixtureDir + '/dates')
                .changed('=1h')
                .find();
            return changedFiles.then((files) => {
                chai_1.assert.deepEqual(files, qualifyNames(['/dates/y.txt']));
            });
        });
    });
    it('emits a match event for each file matched', () => {
        const fh = filehound_1.default.create();
        fh.path(fixtureDir + '/justFiles');
        const spy = sinon.spy();
        fh.on('match', spy);
        const query = fh.find();
        return query.then(() => {
            sinon.assert.callCount(spy, 3);
            sinon.assert.calledWithMatch(spy, 'dummy.txt');
            sinon.assert.calledWithMatch(spy, 'a.json');
            sinon.assert.calledWithMatch(spy, 'b.json');
        });
    });
    it('emits an end event when the search is complete', () => {
        const fh = filehound_1.default.create();
        fh.path(fixtureDir + '/justFiles');
        const spy = sinon.spy();
        fh.on('end', spy);
        const query = fh.find();
        return query.then(() => {
            sinon.assert.callCount(spy, 1);
        });
    });
    it('emits an error event', () => {
        const fh = filehound_1.default.create();
        fh.path(fixtureDir + '/justBad');
        const spy = sinon.spy();
        fh.on('error', spy);
        const query = fh.find();
        return query.catch((e) => {
            chai_1.assert.ok(e);
            sinon.assert.callCount(spy, 1);
        });
    });
}));
//# sourceMappingURL=filehound.js.map