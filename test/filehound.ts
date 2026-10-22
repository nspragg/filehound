import {assert} from 'chai';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import * as sinon from 'sinon';
import {FileHound, FileType} from '../src/filehound';

import {
    accessed,
    changed,
    applyFilter,
    discard,
    ext,
    glob,
    isEmpty,
    like, matchAll,
    modified,
    not,
    size
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
        describe('.or', () => {
            it('returns files matching either of two matchers', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    )
                    .find();

                assert.deepEqual(results, mixedExtensions);
            });


        });

        describe('.and', () => {
            it('returns files matching both matchers', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        ext('.txt')
                            .and(glob('*dummy*'))
                    )
                    .find();

                assert.deepEqual(results, qualifyNames(['/ext/dummy.txt']));
            });

            it('returns files matching both matchers using var args', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        ext('.txt')
                            .and(glob('*dummy*'))
                    )
                    .find();

                assert.deepEqual(results, qualifyNames(['/ext/dummy.txt']));
            });
        });

        describe('.not', () => {
            it('returns files not matching a given matcher using fluent call', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        ext('.txt')
                            .not()
                    )
                    .find();

                assert.deepEqual(results, qualifyNames(['/ext/Dummy.java', '/ext/Dumpy.go', '/ext/dummy.json']));
            });

            it('returns files not matching a given matcher', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        not(ext('.txt'))
                    )
                    .find();

                assert.deepEqual(results, qualifyNames(['/ext/Dummy.java', '/ext/Dumpy.go', '/ext/dummy.json']));
            });
        });

        describe('.ext', () => {
            it('returns files for a given ext', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/justFiles`)
                    .match(ext('.txt'))
                    .find();

                assert.deepEqual(results, textFiles);
            });

            it('returns files for a given ext including a period', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/justFiles`)
                    .match(
                        ext('.txt')
                    )
                    .find();

                assert.deepEqual(results, textFiles);
            });

            it('returns files for all matching extensions', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(ext(['txt', '.json']))
                    .find();

                assert.deepEqual(results, mixedExtensions);
            });

            it('supports var args', async () => {
                const results = await FileHound.create()
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

                const results = await FileHound.create()
                    .paths(`${fixtureDir}/deeplyNested`)
                    .type(FileType.DIRECTORY)
                    .match(glob('*mydir*'))
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

                const results = await FileHound.create()
                    .paths(`${fixtureDir}/deeplyNestedWithHiddenDir`)
                    .type(FileType.DIRECTORY)
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

                const results = await FileHound.create()
                    .paths(`${fixtureDir}/deeplyNestedWithHiddenDir`)
                    .type(FileType.DIRECTORY)
                    .ignoreHiddenDirectories()
                    .find();

                assert.deepEqual(results, expectedDirectories);
            });

            it('filters matching directories', async () => {
                const expectedDirectories = qualifyNames([
                    '/deeplyNested/mydir',
                    '/deeplyNested/mydir/mydir2',
                    '/deeplyNested/mydir/mydir2/mydir3'
                ]);

                const results = await FileHound.create()
                    .paths(`${fixtureDir}/deeplyNested`)
                    .type(FileType.DIRECTORY)
                    .match(glob('*dir4*')
                        .not())
                    .find();

                assert.deepEqual(results, expectedDirectories);
            });

        });

        describe('.glob', () => {
            it('returns files for given glob pattern', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/mixed`)
                    .match(
                        glob('*ab*.json')
                    )
                    .find();

                assert.deepEqual(results.sort(), matchFiles);
            });

            it('performs recursive search using matching on a given pattern', async () => {
                const results = await FileHound.create()
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
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/nested`)
                    .match(
                        discard('mydir')
                    )
                    .find();

                const expected = nestedFiles.filter(f => !/mydir/.test(f));
                assert.deepEqual(results, expected);
            });

            it('ignores files', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/nested`)
                    .match(
                        discard('c.json')
                    )
                    .find();

                const expected = nestedFiles.filter(f => !/c.json/.test(f));
                assert.deepEqual(results, expected);
            });

            it('ignores everything using a greedy _match', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/nested`)
                    .match(
                        discard('.*')
                    )
                    .find();

                assert.deepEqual(results, []);
            });

            it('matches all files after being negated', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/nested`)
                    .match(
                        discard('.*').not()
                    )
                    .find();

                assert.deepEqual(results, nestedFiles);
            });

            it('applies multiple discard filters as variable arguments', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/mixed`)
                    .match(
                        discard('a.json', 'z.json')
                    )
                    .find();

                assert.deepEqual(
                    results,
                    qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json'])
                );
            });

            it('applies an array of discard filters', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/mixed`)
                    .match(
                        discard(...['a.json', 'z.json'])
                    )
                    .find();

                assert.deepEqual(
                    results,
                    qualifyNames(['/mixed/aabbcc.json', '/mixed/ab.json'])
                );
            });
        });

        describe('.like', () => {
            it('returns files matching a given text pattern', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/mixed`)
                    .match(
                        like('.*aa.*')
                    )
                    .find();

                assert.deepEqual(results, qualifyNames(['/mixed/aabbcc.json']));
            });
        });

        describe('.size', () => {
            it('returns files matched using the equality operator by default', async () => {
                const sizeFile10Bytes = await FileHound.create()
                    .paths(`${fixtureDir}/justFiles`)
                    .match(
                        size(20)
                    )
                    .find();

                assert.deepEqual(sizeFile10Bytes, qualifyNames(['/justFiles/b.json']));
            });

            it('returns files that equal a given number of bytes', async () => {
                const sizeFile10Bytes = await FileHound.create()
                    .paths(`${fixtureDir}/justFiles`)
                    .match(
                        size('==20')
                    )
                    .find();

                assert.deepEqual(sizeFile10Bytes, qualifyNames(['/justFiles/b.json']));
            });

            it('returns files greater than a given size', async () => {
                const sizeGreaterThan1k = await FileHound.create()
                    .paths(`${fixtureDir}/sizes`)
                    .match(size('>1024'))
                    .find();

                assert.deepEqual(sizeGreaterThan1k, qualifyNames(['/sizes/2k.txt']));
            });

            it('returns files less than a given size', async () => {
                const sizeLessThan1k = await FileHound.create()
                    .paths(`${fixtureDir}/sizes`)
                    .match(size('<1024'))
                    .find();

                assert.deepEqual(
                    sizeLessThan1k,
                    qualifyNames(['/sizes/10b.txt', '/sizes/1b.txt'])
                );
            });

            it('returns files using file size units', async () => {
                const sizeLessThan15bytes = await FileHound.create()
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
                const lessThanOrEqualTo1k = await FileHound.create()
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
                const greaterThanOrEqualTo1k = await FileHound.create()
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
                const range = await FileHound.create()
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
                const allEmpty = await FileHound.create()
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

        describe('.matchAll()', () => {
            it('returns all files in a given directory', async () => {
                const allFiles = await FileHound.create()
                    .paths(`${fixtureDir}/justFiles`)
                    .match(
                        matchAll()
                    )
                    .find();

                assert.deepEqual(allFiles, justFiles);
            });

            it('returns all files by default', async () => {
                const allFiles = await FileHound.create()
                    .paths(`${fixtureDir}/justFiles`)
                    .find();

                assert.deepEqual(allFiles, justFiles);
            });
        });
    });

    describe('.type', () => {
        it('returns only files', async () => {
            const files = await FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(FileType.REGULAR)
                .find();

            assert.deepEqual(
                files,
                qualifyNames([
                    '/deeplyNested/c.json',
                    'deeplyNested/d.json',
                    'deeplyNested/mydir/e.json',
                    'deeplyNested/mydir/mydir2/f.json',
                    'deeplyNested/mydir/mydir2/mydir3/mydir4/failed.json',
                    'deeplyNested/mydir/mydir2/mydir3/z.json',
                    'deeplyNested/mydir/mydir2/y.json'

                ])
            );
        });

        it('returns only directories', async () => {
            const directories = await FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(FileType.DIRECTORY)
                .find();

            assert.deepEqual(
                directories,
                qualifyNames([
                    '/deeplyNested/mydir',
                    '/deeplyNested/mydir/mydir2',
                    '/deeplyNested/mydir/mydir2/mydir3',
                    '/deeplyNested/mydir/mydir2/mydir3/mydir4'
                ])
            );
        });

        it('returns files and directories', async () => {
            const filesAndDirectories = await FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(
                    FileType.REGULAR,
                    FileType.DIRECTORY
                )
                .find();

            assert.deepEqual(
                filesAndDirectories,
                qualifyNames([
                    '/deeplyNested/c.json',
                    'deeplyNested/d.json',
                    'deeplyNested/mydir/e.json',
                    'deeplyNested/mydir/mydir2/f.json',
                    'deeplyNested/mydir/mydir2/mydir3/mydir4/failed.json',
                    'deeplyNested/mydir/mydir2/mydir3/z.json',
                    'deeplyNested/mydir/mydir2/y.json',
                    '/deeplyNested/mydir',
                    '/deeplyNested/mydir/mydir2',
                    '/deeplyNested/mydir/mydir2/mydir3',
                    '/deeplyNested/mydir/mydir2/mydir3/mydir4'
                ])
            );
        });

        it('throws when an invalid file type is provided', async () => {
            assertType(TypeError, 'Invalid file type: invalid.', 'invalid' as any);
        });

        it('throws when type is absent', async () => {
            assertType(RangeError,'At least one file type must be specified');
        });

        function assertType(expectedError: Function, re: RegExp|string, ...types: any[]) {
            assert.throws( () => {
                FileHound.create()
                    .paths(`${fixtureDir}/deeplyNested`)
                    .type(...types);
            }, expectedError, re);
        }
    });

    describe('.depth', () => {
        it('only returns files in the current directory', async () => {
            const query = FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .depth(0)
                .find();

            const files = await query;
            assert.deepEqual(
                files,
                qualifyNames(['/deeplyNested/c.json', 'deeplyNested/d.json'])
            );
        });

        it('only returns files one level deep', async () => {
            const query = FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .depth(1)
                .match(ext('json'))
                .find();

            const files = await query;
            assert.deepEqual(
                files,
                qualifyNames([
                    '/deeplyNested/c.json',
                    'deeplyNested/d.json',
                    'deeplyNested/mydir/e.json'
                ])
            );
        });

        it('returns files n level deep', async () => {
            const query = FileHound.create()
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
            const files = await FileHound.create()
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

        it('throws when depth is negative', async () => {
            await assertDepth(-1);
        });


        it('throws when depth is a fractional number', async () => {
            await assertDepth(1.5);
        });

        it('throws when depth is a Nan', async () => {
            await assertDepth(NaN);
        });

        it('throws when depth is a Infinity', async () => {
            await assertDepth(Infinity);
        });

        it('throws when depth is a null', async () => {
            await assertDepth(null);
        });

        it('throws when depth is a undefined', async () => {
            await assertDepth(null);
        });

        it('throws when depth is a string', async () => {
            await assertDepth("0");
        });

        async function assertDepth(depth: any) {
            try {
                await FileHound.create()
                    .paths(`${fixtureDir}/deeplyNested`)
                    .depth(depth)
                    .find();
                assert.fail('Expected an error to be thrown');
            } catch (err) {
                assert.instanceOf(err, RangeError);
                assert.equal(err.message, 'Depth must be a positive integer');
            }
        }
    });

    describe('.paths', () => {
        it('returns all files in a given directory', async () => {
            const files = await FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .find();

            assert.deepEqual(files, justFiles);
        });

        it('returns files performing a recursive search', async () => {
            const files = await FileHound.create()
                .paths(`${fixtureDir}/nested`)
                .find();

            assert.deepEqual(files, nestedFiles);
        });

        it('returns matching files from multiple search paths', async () => {
            const location1 = `${fixtureDir}/nested`;
            const location2 = `${fixtureDir}/justFiles`;

            const files = await FileHound.create()
                .paths(location1, location2)
                .find();

            const expected = nestedFiles.concat(justFiles).sort();
            assert.deepEqual(files, expected);
        });

        it('returns matching files given a array of paths', async () => {
            const location1 = `${fixtureDir}/nested`;
            const location2 = `${fixtureDir}/justFiles`;

            const files = await FileHound.create()
                .paths(...[location1, location2])
                .find();

            const expected = nestedFiles.concat(justFiles).sort();
            assert.deepEqual(files, expected);
        });

        it('removes duplicate paths', async () => {
            const location1 = `${fixtureDir}/nested`;

            const fh = await FileHound.create();
            fh.paths(location1, location1);

            assert.deepEqual(fh.getPaths(), [location1]);
        });

        it('returns a defensive copy of the search directories', async () => {
            const fh = await FileHound.create();
            fh.paths('a', 'b', 'c');
            const tempDirectory = fh.getPaths();
            tempDirectory.push('d');

            assert.equal(fh.getPaths().length, 3);
        });

        it('normalises paths', async () => {
            const location1 = `${fixtureDir}/nested`;
            const location2 = `${fixtureDir}/nested/mydir`;
            const location3 = `${fixtureDir}/justFiles/moreFiles`;
            const location4 = `${fixtureDir}/justFiles`;

            const fh = FileHound.create()
                .paths(location2, location1, location4, location3);

            assert.deepEqual(fh.getPaths(), [location4, location1]);
        });
    });

    describe('.findSync', () => {
        it('returns an array of matching files', () => {
            const files = FileHound.create()
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

            const results = FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(FileType.DIRECTORY)
                .match(
                    glob('*dir4*')
                        .not()
                )
                .findSync();

            assert.deepEqual(results, expectedDirectories);
        });

        it('filters matching files and directories', () => {
            const filesAndDirectories = FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(
                    FileType.REGULAR,
                    FileType.DIRECTORY
                )
                .findSync();

            assert.deepEqual(
                filesAndDirectories,
                qualifyNames([
                    '/deeplyNested/c.json',
                    'deeplyNested/d.json',
                    '/deeplyNested/mydir',
                    'deeplyNested/mydir/e.json',
                    '/deeplyNested/mydir/mydir2',
                    'deeplyNested/mydir/mydir2/f.json',
                    '/deeplyNested/mydir/mydir2/mydir3',
                    '/deeplyNested/mydir/mydir2/mydir3/mydir4',
                    'deeplyNested/mydir/mydir2/mydir3/mydir4/failed.json',
                    'deeplyNested/mydir/mydir2/mydir3/z.json',
                    'deeplyNested/mydir/mydir2/y.json'
                ])
            );
        });

        it('filters matching files', () => {
            const files = FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .match(ext('txt'))
                .findSync();

            assert.deepEqual(files, textFiles);
        });
    });

    describe('.any', () => {
        it('returns matching files for any query', async () => {
            const jsonStartingWithZ = FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .match(glob('*.json'));

            const onlyTextFles = FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .match(ext('txt'));

            const results = await FileHound.any(jsonStartingWithZ, onlyTextFles);

            assert.deepEqual(results, justFiles);
        });
    });

    describe('.ignoreHiddenFiles()', () => {
        it('ignores hidden files', async () => {
            const noHiddenFiles = await FileHound.create()
                .paths(`${fixtureDir}/visibility`)
                .ignoreHiddenFiles()
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
            const noHiddenFiles = await FileHound.create()
                .paths(`${fixtureDir}/visibility`)
                .ignoreHiddenFiles()
                .ignoreHiddenDirectories()
                .find();

            assert.equal(noHiddenFiles.length, 1);
            assert.deepEqual(noHiddenFiles, qualifyNames(['/visibility/visible.json']));
        });
    });

    describe('.applyFilter', () => {
        it('returns files based on a custom filter', async () => {
            const files = await FileHound.create()
                .match(applyFilter((file) => {
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
            const modifiedNDaysAgo = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(modified(10))
                .find();

            assert.deepEqual(modifiedNDaysAgo, qualifyNames(['/dates/a.txt']));
        });

        it('returns files greater than n days', async () => {
            const modifiedNDaysAgo = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(modified('>2 days'))
                .find();

            assert.deepEqual(modifiedNDaysAgo, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
        });

        it('returns files less than n days', async () => {
            const modifiedNDaysAgo = await FileHound.create()
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
            const accessedFiles = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(accessed('>8h'))
                .find();

            assert.deepEqual(accessedFiles, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
        });

        it('returns files accessed < 3 hours ago', async () => {
            const accessedFiles = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(accessed('<3h'))
                .find();

            assert.deepEqual(
                accessedFiles,
                qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt'])
            );
        });

        it('returns files accessed 1 hour ago', async () => {
            const accessedFiles = await FileHound.create()
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
            const changedFiles = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(changed('>8h'))
                .find();

            assert.deepEqual(changedFiles, qualifyNames(['/dates/a.txt', '/dates/w.txt']));
        });

        it('returns files changed < 3 hours ago', async () => {
            const changedFiles = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(changed('<3h'))
                .find();

            assert.deepEqual(
                changedFiles,
                qualifyNames(['/dates/x.txt', '/dates/y.txt', '/dates/z.txt'])
            );
        });

        it('returns files changed 1 hour ago', async () => {
            const changedFiles = await FileHound.create()
                .paths(`${fixtureDir}/dates`)
                .match(changed('=1h'))
                .find();

            assert.deepEqual(changedFiles, qualifyNames(['/dates/y.txt']));
        });
    });

    describe('events', () => {
        it('emits a match event for each file matched', async () => {
            const spy = sinon.spy();
            const fh = FileHound.create();

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
            const fh = FileHound.create();

            await fh.paths(`${fixtureDir}/justFiles`)
                .on('end', spy)
                .find();

            sinon.assert.callCount(spy, 1);
        });

        it('emits an error event', async () => {
            const fh = FileHound.create();
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

    it('filehound instance should be immutable after calling find');
});
