import {assert} from 'chai';
import fs from 'node:fs';
import {getEventListeners} from 'node:events';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import * as sinon from 'sinon';
import {FileHound, type FileWithStats} from '../src/filehound.js';
import {FileType} from '../src/filetype.js';
import type {FileView} from '../src/file.js';

import {
    accessed,
    applyFilter,
    applyFilterSync,
    changed,
    discard,
    ext,
    type FilePredicate,
    glob,
    isEmpty,
    isSyncPredicate,
    like,
    matchAll,
    modified,
    not,
    size
} from '../src/matchers.js';

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
const sandbox = sinon.createSandbox();

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function getAbsolutePath(file: string): string {
    return path.join(`${__dirname}/fixtures/`, file);
}

function qualifyNames(names: string[]): string[] {
    return names.map(getAbsolutePath);
}

// Days are subtracted in local calendar time (as moment does), so they stay
// correct across daylight saving changes
function timeAgo(duration: number, unit: 'days' | 'hours'): Date {
    if (unit === 'days') {
        const date = new Date();
        date.setDate(date.getDate() - duration);
        return date;
    }
    return new Date(Date.now() - duration * MILLISECONDS_PER_HOUR);
}

function createFile(fname: string, opts: any): void {
    // Truncate to whole seconds so the file is at least `duration` old when checked
    const time = new Date(Math.floor(timeAgo(opts.duration, opts.modifier).getTime() / 1000) * 1000);

    const fd = fs.openSync(fname, 'w+');
    fs.futimesSync(fd, time, time);
    fs.closeSync(fd);
}

async function collect<T>(matches: AsyncIterable<T>): Promise<T[]> {
    const found = [];
    for await (const match of matches) {
        found.push(match);
    }
    return found;
}

function deleteFile(fname: fs.PathLike): void {
    fs.unlinkSync(fname);
}

describe('FileHound', async () => {
    const fixtureDir = `${__dirname}/fixtures`;

    function assertMatchError(value: any): void {
        assert.throws(() => {
            FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .match(value);
        }, TypeError, 'Match expression must be a valid matcher');
    }

    describe('Matchers', async () => {
        it('throws when a match expression is null', () => {
            assertMatchError(null);
        });

        it('throws when a match expression is undefined', () => {
            assertMatchError(undefined);
        });

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
                    .match(glob('**/*mydir*'))
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
                    .match(glob('**/*dir4*')
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

            it('matches patterns at any depth using **', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/nested`)
                    .match(
                        glob('**/*.json')
                    )
                    .find();

                const expected = nestedFiles.filter(f => /\.json$/.test(f));

                assert.deepEqual(results.sort(), expected);
            });

            it('matches patterns without ** against the top level of the search path only', async () => {
                const results = await findGlob('nested', '*.json');

                assert.deepEqual(results, qualifyNames(['nested/c.json', 'nested/d.json']));
            });

            it('matches patterns relative to each search path', async () => {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/nested`, `${fixtureDir}/ext`)
                    .match(glob('*.json'))
                    .find();

                assert.deepEqual(results.sort(), qualifyNames(['ext/dummy.json', 'nested/c.json', 'nested/d.json']));
            });

            async function findGlob(dir: string, pattern: string): Promise<string[]> {
                const results = await FileHound.create()
                    .paths(`${fixtureDir}/${dir}`)
                    .match(glob(pattern))
                    .find();

                return results.sort();
            }

            it('supports brace expansion', async () => {
                const results = await findGlob('ext', '*.{java,go}');

                assert.deepEqual(results, qualifyNames(['ext/Dummy.java', 'ext/Dumpy.go']));
            });

            it('supports single character wildcards', async () => {
                const results = await findGlob('mixed', '?.json');

                assert.deepEqual(results, qualifyNames(['mixed/a.json', 'mixed/z.json']));
            });

            it('supports negated character classes', async () => {
                const results = await findGlob('mixed', '[!a]*.json');

                assert.deepEqual(results, qualifyNames(['mixed/z.json']));
            });

            it('supports extglob patterns', async () => {
                const results = await findGlob('mixed', '+(a|b).json');

                assert.deepEqual(results, qualifyNames(['mixed/a.json', 'mixed/ab.json']));
            });

            it('matches patterns containing directories against the full path', async () => {
                const results = await findGlob('nested', '**/mydir/*.json');

                assert.deepEqual(results, qualifyNames(['nested/mydir/e.json']));
            });

            it('does not match dotfiles or dot directories with wildcards', async () => {
                const results = await findGlob('visibility', '**/*.json');

                assert.deepEqual(results, qualifyNames(['visibility/visible.json']));
            });

            it('matches the same files as fs.glob', async () => {
                // Includes case differences, which fs.glob treats per platform
                const cases = [
                    ['ext', 'dummy.*'],
                    ['ext', '*.{java,go}'],
                    ['nested', '**/*.json'],
                    ['visibility', '**/*.json'],
                    ['deeplyNested', '**/*']
                ];

                for (const [dir, pattern] of cases) {
                    const cwd = getAbsolutePath(dir);
                    const expected = fs.globSync(pattern, {cwd, withFileTypes: true})
                        .filter(entry => entry.isFile())
                        .map(entry => path.join(entry.parentPath, entry.name))
                        .sort();

                    assert.deepEqual(await findGlob(dir, pattern), expected, pattern);
                }
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

        it('throws when an invalid file type is provided', async () => {
            assertType(TypeError, 'Invalid file type: invalid.', 'invalid' as any);
        });

        it('throws when a file type name is given instead of its value', async () => {
            assertType(TypeError, 'Invalid file type: DIRECTORY.', 'DIRECTORY' as any);
        });

        it('accepts file type values as strings', async () => {
            const results = await FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type('directory')
                .find();

            assert.deepEqual(results, await FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(FileType.DIRECTORY)
                .find());
            assert.isNotEmpty(results);
        });

        it('throws when type is absent', async () => {
            assertType(RangeError,'At least one file type must be specified');
        });

        function assertType(expectedError: new (...args: any[]) => Error, re: RegExp|string, ...types: any[]): void {
            assert.throws( () => {
                FileHound.create()
                    .paths(`${fixtureDir}/deeplyNested`)
                    .type(...types);
            }, expectedError, re);
        }
    });

    describe('relative search paths', () => {
        it('returns paths as path.join would, without a leading ./', async () => {
            const dir = path.relative(process.cwd(), `${fixtureDir}/justFiles`);
            const expected = fs.readdirSync(dir).sort().map(name => path.join(dir, name));

            for (const searchPath of [dir, `./${dir}`, `./${dir}/`]) {
                assert.deepEqual(await FileHound.create().paths(searchPath).find(), expected);
                assert.deepEqual(FileHound.create().paths(searchPath).findSync(), expected);
            }
        });
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

        it('returns directories at the depth limit without walking them', async () => {
            const query = (depth: number): FileHound => FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(FileType.DIRECTORY)
                .depth(depth);

            for (const [depth, expected] of [
                [0, ['deeplyNested/mydir']],
                [1, ['deeplyNested/mydir', 'deeplyNested/mydir/mydir2']]
            ] as const) {
                assert.deepEqual(await query(depth).find(), qualifyNames([...expected]));
                assert.deepEqual(query(depth).findSync(), qualifyNames([...expected]));
            }
        });

        it('returns files and directories in the current directory', async () => {
            const files = await FileHound.create()
                .paths(`${fixtureDir}/deeplyNested`)
                .type(FileType.REGULAR, FileType.DIRECTORY)
                .depth(0)
                .find();

            assert.deepEqual(files, qualifyNames(['deeplyNested/c.json', 'deeplyNested/d.json', 'deeplyNested/mydir']));
        });

        it('ignores a trailing separator on the search path', async () => {
            const query = (dir: string): FileHound => FileHound.create().paths(dir).depth(0);

            for (const dir of [`${fixtureDir}/deeplyNested/`, `${fixtureDir}/deeplyNested`]) {
                assert.deepEqual(await query(dir).find(), qualifyNames(['/deeplyNested/c.json', 'deeplyNested/d.json']));
                assert.deepEqual(query(dir).findSync(), qualifyNames(['/deeplyNested/c.json', 'deeplyNested/d.json']));
            }
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
            await assertDepth('0');
        });

        async function assertDepth(depth: any): Promise<void> {
            try {
                await FileHound.create()
                    .paths(`${fixtureDir}/deeplyNested`)
                    .depth(depth)
                    .find();
                assert.fail('Expected an error to be thrown');
            } catch (err) {
                assert.instanceOf(err, RangeError);
                assert.equal((err as RangeError).message, 'Depth must be a positive integer');
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

        it('rejects an invalid path, keeping the file system error as the cause', async () => {
            const badPath = `${fixtureDir}/justBad`;
            try {
                await FileHound.create().paths(badPath).find();
                assert.fail('Expected an error to be thrown');
            } catch (err) {
                assert.equal((err as Error).message, `'${badPath}' is not a valid path`);
                assert.propertyVal((err as Error).cause, 'code', 'ENOENT');
            }
        });

        it('throws on an invalid path, keeping the file system error as the cause (sync)', () => {
            const badPath = `${fixtureDir}/justBad`;
            try {
                FileHound.create().paths(badPath).findSync();
                assert.fail('Expected an error to be thrown');
            } catch (err) {
                assert.equal((err as Error).message, `'${badPath}' is not a valid path`);
                assert.propertyVal((err as Error).cause, 'code', 'ENOENT');
            }
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

        it('accepts an array of paths', async () => {
            const location1 = `${fixtureDir}/nested`;
            const location2 = `${fixtureDir}/justFiles`;

            const files = await FileHound.create()
                .paths([location1, location2])
                .find();

            const expected = nestedFiles.concat(justFiles).sort();
            assert.deepEqual(files, expected);
        });

        it('does not reorder the search paths when getting them', () => {
            const location1 = `${fixtureDir}/nested`;
            const location2 = `${fixtureDir}/justFiles`;

            const fh = FileHound.create().paths(location1, location2);
            fh.getPaths();
            fh.depth(1);

            assert.deepEqual(fh.getPaths(), [location1, location2]);
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
                    glob('**/*dir4*')
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

        it('ignores hidden files when searching synchronously', () => {
            const noHiddenFiles = FileHound.create()
                .paths(`${fixtureDir}/visibility`)
                .ignoreHiddenFiles()
                .findSync();

            assert.deepEqual(noHiddenFiles, qualifyNames([
                '/visibility/.hidden/visible.json',
                '/visibility/visible.json'
            ]));
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

        it('returns files based on an asynchronous custom filter', async () => {
            const files = await FileHound.create()
                .match(applyFilter(async file => await file.size() === 1024))
                .paths(`${fixtureDir}/custom`)
                .find();

            assert.deepEqual(files, qualifyNames(['/custom/passed.txt']));
        });

        it('throws when used with findSync', () => {
            const fh = FileHound.create()
                .match(applyFilter(async file => await file.size() === 1024))
                .paths(`${fixtureDir}/custom`);

            assert.throws(() => fh.findSync(), TypeError, 'applyFilter() filters can only be used with find()');
        });
    });

    describe('.applyFilterSync', () => {
        it('returns files based on a custom filter', async () => {
            const query = (): FileHound => FileHound.create()
                .match(applyFilterSync(file => file.sizeSync() === 1024))
                .paths(`${fixtureDir}/custom`);

            assert.deepEqual(await query().find(), qualifyNames(['/custom/passed.txt']));
            assert.deepEqual(query().findSync(), qualifyNames(['/custom/passed.txt']));
        });
    });

    describe('isSyncPredicate', () => {
        it('is true for predicates that only use the file name', () => {
            assert.isTrue(isSyncPredicate(ext('json')));
            assert.isTrue(isSyncPredicate(glob('*.json')));
            assert.isTrue(isSyncPredicate(like('json')));
            assert.isTrue(isSyncPredicate(discard('node_modules')));
            assert.isTrue(isSyncPredicate(matchAll()));
            assert.isTrue(isSyncPredicate(applyFilterSync(() => true)));
        });

        it('is false for predicates that read the file', () => {
            assert.isFalse(isSyncPredicate(size('>0')));
            assert.isFalse(isSyncPredicate(modified('<1 day')));
            assert.isFalse(isSyncPredicate(accessed('<1 day')));
            assert.isFalse(isSyncPredicate(changed('<1 day')));
            assert.isFalse(isSyncPredicate(isEmpty()));
            assert.isFalse(isSyncPredicate(applyFilter(async () => true)));
        });

        it('is true for a combined predicate only when every part is', () => {
            assert.isTrue(isSyncPredicate(ext('json').and(glob('*')).or(not(ext('txt')))));
            assert.isFalse(isSyncPredicate(ext('json').and(size('>0'))));
            assert.isFalse(isSyncPredicate(ext('json').or(size('>0'))));
            assert.isFalse(isSyncPredicate(not(size('>0'))));
        });

        it('is false for a predicate that is not one of ours', () => {
            const custom: FilePredicate = {
                test: async () => true,
                testSync: () => true,
                not: () => custom,
                or: () => custom,
                and: () => custom
            };
            assert.isFalse(isSyncPredicate(custom));
        });
    });

    describe('async predicates', () => {
        afterEach(() => {
            sandbox.restore();
        });

        it('does not make synchronous file system calls during find', async () => {
            const statSync = sandbox.spy(fs, 'statSync');
            const lstatSync = sandbox.spy(fs, 'lstatSync');
            const readdirSync = sandbox.spy(fs, 'readdirSync');

            const files = await FileHound.create()
                .paths(`${fixtureDir}/sizes`)
                .match(size('>0').and(modified('<1000 days').or(not(isEmpty()))))
                .find();

            assert.isNotEmpty(files);
            sinon.assert.notCalled(statSync);
            sinon.assert.notCalled(lstatSync);
            sinon.assert.notCalled(readdirSync);
        });

        it('stats each file at most once', async () => {
            const stat = sandbox.spy(fs.promises, 'stat');

            const files = await FileHound.create()
                .paths(`${fixtureDir}/sizes`)
                .match(size('>=0').and(modified('<1000 days')))
                .includeFileStats()
                .find();

            const statted = stat.getCalls().map(call => call.args[0]);
            assert.equal(statted.length, new Set(statted).size);
            assert.includeMembers(statted, files.map(file => file.path));
        });
    });

    describe('special files', () => {
        let tmpDir: string;
        let server: net.Server;

        before((done) => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fh-'));
            fs.writeFileSync(path.join(tmpDir, 'a.txt'), '');
            server = net.createServer().listen(path.join(tmpDir, 's.sock'), done);
        });

        after((done) => {
            server.close(() => {
                fs.rmSync(tmpDir, {recursive: true, force: true});
                done();
            });
        });

        it('are not returned as regular files', async () => {
            const query = (): FileHound => FileHound.create().paths(tmpDir);

            assert.deepEqual(await query().find(), [path.join(tmpDir, 'a.txt')]);
            assert.deepEqual(query().findSync(), [path.join(tmpDir, 'a.txt')]);
        });
    });

    describe('.includeFileStats', () => {
        it('returns the path and stats of each match', async () => {
            const query = (): FileHound<FileWithStats> => FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .includeFileStats();

            for (const files of [await query().find(), query().findSync()]) {
                assert.deepEqual(files.map(file => file.path), justFiles);
                for (const {path: file, stats} of files) {
                    assert.equal(stats.size, fs.statSync(file).size);
                }
            }
        });

        it('emits matches with their stats', async () => {
            const spy = sinon.spy();

            await FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .includeFileStats()
                .on('match', spy)
                .find();

            sinon.assert.callCount(spy, 3);
            sinon.assert.calledWithMatch(spy, {path: justFiles[0], stats: sinon.match.instanceOf(fs.Stats)});
        });

        it('throws when calling .includeFileStats after query started', () => {
            assert.throws(() => {
                const fh = FileHound.create().paths(`${fixtureDir}/justFiles`);
                fh.findSync();
                fh.includeFileStats();
            }, Error, 'Cannot modify query after search has started');
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
        let statSync: sinon.SinonStub;

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
            // ctime cannot be set directly, so async stats come from the same stub
            sandbox.stub(fs.promises, 'stat').callsFake(async (p: fs.PathLike) => statSync(p));
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
                        ctime: timeAgo(file.changed, 'hours'),
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

    describe('Query immutability', () => {
        it('Throws when calling .match after query started', () => {
            assert.throws( () => {
                const fh = FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    );

                fh.findSync();
                fh.match(ext('.java'));

            }, Error, 'Cannot modify query after search has started');
        });

        it('Throws when calling .paths after query started', () => {
            assert.throws( () => {
                const fh = FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    );

                fh.findSync();
                fh.paths(`${fixtureDir}/justFiles`);

            }, Error, 'Cannot modify query after search has started');
        });

        it('Throws when calling .type after query started', () => {
            assert.throws( () => {
                const fh = FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .type(FileType.REGULAR)
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    );

                fh.findSync();
                fh.type(FileType.DIRECTORY);

            }, Error, 'Cannot modify query after search has started');
        });

        it('Throws when calling .depth after query started', () => {
            assert.throws( () => {
                const fh = FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .depth(1)
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    );

                fh.findSync();
                fh.depth(2);

            }, Error, 'Cannot modify query after search has started');
        });

        it('Throws when calling .ignoreHiddenFiles after query started', () => {
            assert.throws( () => {
                const fh = FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .ignoreHiddenFiles()
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    );

                fh.findSync();
                fh.ignoreHiddenFiles();

            }, Error, 'Cannot modify query after search has started');
        });

        it('Throws when calling .ignoreHiddenDirectories after query started', () => {
            assert.throws( () => {
                const fh = FileHound.create()
                    .paths(`${fixtureDir}/ext`)
                    .ignoreHiddenDirectories()
                    .match(
                        ext('.txt')
                            .or(ext('.json'))
                    );

                fh.findSync();
                fh.ignoreHiddenDirectories();

            }, Error, 'Cannot modify query after search has started');
        });
    });

    describe('symlinks', () => {
        let tmpDir: string;

        function inTmp(...names: string[]): string {
            return path.join(tmpDir, ...names);
        }

        async function findBoth(fh: () => FileHound): Promise<string[][]> {
            return [(await fh().find()).toSorted(), fh().findSync().toSorted()];
        }

        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filehound-'));
            fs.mkdirSync(inTmp('real'));
            fs.writeFileSync(inTmp('real', 'a.txt'), '');
        });

        afterEach(() => {
            fs.rmSync(tmpDir, {recursive: true, force: true});
        });

        it('follows symlinks by default', async () => {
            fs.symlinkSync(inTmp('real'), inTmp('linkdir'), 'dir');
            fs.symlinkSync(inTmp('real', 'a.txt'), inTmp('link.txt'));

            const expected = [inTmp('link.txt'), inTmp('linkdir', 'a.txt'), inTmp('real', 'a.txt')];
            const [results, syncResults] = await findBoth(() => FileHound.create().paths(tmpDir));

            assert.deepEqual(results, expected);
            assert.deepEqual(syncResults, expected);
        });

        it('excludes symlinks when ignoreSymlinks is set', async () => {
            fs.symlinkSync(inTmp('real'), inTmp('linkdir'), 'dir');
            fs.symlinkSync(inTmp('real', 'a.txt'), inTmp('link.txt'));

            const expected = [inTmp('real', 'a.txt')];
            const [results, syncResults] = await findBoth(() => FileHound.create().paths(tmpDir).ignoreSymlinks());

            assert.deepEqual(results, expected);
            assert.deepEqual(syncResults, expected);
        });

        it('excludes linked directories from directory searches when ignoreSymlinks is set', async () => {
            fs.symlinkSync(inTmp('real'), inTmp('linkdir'), 'dir');

            const query = (): FileHound => FileHound.create().paths(tmpDir).type(FileType.DIRECTORY).ignoreSymlinks();
            const [results, syncResults] = await findBoth(query);

            assert.deepEqual(results, [inTmp('real')]);
            assert.deepEqual(syncResults, [inTmp('real')]);
        });

        it('skips broken symlinks', async () => {
            fs.symlinkSync(inTmp('missing'), inTmp('dead'));

            const [results, syncResults] = await findBoth(() => FileHound.create().paths(tmpDir));

            assert.deepEqual(results, [inTmp('real', 'a.txt')]);
            assert.deepEqual(syncResults, [inTmp('real', 'a.txt')]);
        });

        it('does not follow a symlink back to an ancestor directory', async () => {
            fs.symlinkSync(tmpDir, inTmp('real', 'loop'), 'dir');

            const [results, syncResults] = await findBoth(() => FileHound.create().paths(tmpDir));

            assert.deepEqual(results, [inTmp('real', 'a.txt')]);
            assert.deepEqual(syncResults, [inTmp('real', 'a.txt')]);
        });

        it('throws when calling .ignoreSymlinks after query started', () => {
            assert.throws(() => {
                const fh = FileHound.create().paths(tmpDir);
                fh.findSync();
                fh.ignoreSymlinks();
            }, Error, 'Cannot modify query after search has started');
        });
    });

    describe('.iterate', () => {
        it('returns the same matches as find, in the same order', async () => {
            const query = (): FileHound => FileHound.create().paths(`${fixtureDir}/nested`);

            assert.deepEqual(await collect(query().iterate()), await query().find());
        });

        it('returns matches with their stats', async () => {
            const files = await collect(FileHound.create()
                .paths(`${fixtureDir}/justFiles`)
                .includeFileStats()
                .iterate());

            assert.deepEqual(files.map(file => file.path), justFiles);
            assert.isTrue(files[0].stats.isFile());
        });

        it('stops the search when the loop is left early', async () => {
            const found = [];
            for await (const file of FileHound.create().paths(`${fixtureDir}/justFiles`).iterate()) {
                found.push(file);
                break;
            }

            assert.deepEqual(found, [justFiles[0]]);
        });

        it('rejects an invalid path when iterated', async () => {
            const iterator = FileHound.create().paths(`${fixtureDir}/justBad`).iterate();

            try {
                await iterator.next();
            } catch (err) {
                assert.match((err as Error).message, /is not a valid path/);
                return;
            }
            assert.fail('Expected to reject!');
        });

        it('emits a match event for each match, then an end event', async () => {
            const events: string[] = [];
            const fh = FileHound.create().paths(`${fixtureDir}/justFiles`);
            fh.on('match', file => events.push(file)).on('end', () => events.push('end'));

            await collect(fh.iterate());

            assert.deepEqual(events, [...justFiles, 'end']);
        });

        it('emits an end event, with no further matches, when the loop is left early', async () => {
            const events: string[] = [];
            const fh = FileHound.create().paths(`${fixtureDir}/justFiles`);
            fh.on('match', file => events.push(file)).on('end', () => events.push('end'));

            for await (const file of fh.iterate()) {
                assert.ok(file);
                break;
            }

            assert.deepEqual(events, [justFiles[0], 'end']);
        });

        it('emits an error event, then an end event, when the search fails', async () => {
            const events: string[] = [];
            const fh = FileHound.create().paths(`${fixtureDir}/justBad`);
            fh.on('error', () => events.push('error')).on('end', () => events.push('end'));

            try {
                await collect(fh.iterate());
            } catch {
                assert.deepEqual(events, ['error', 'end']);
                return;
            }
            assert.fail('Expected to reject!');
        });

        it('throws when modifying the query after iterate is called', () => {
            assert.throws(() => {
                const fh = FileHound.create().paths(`${fixtureDir}/justFiles`);
                fh.iterate();
                fh.depth(1);
            }, Error, 'Cannot modify query after search has started');
        });
    });

    // The async walk reads directories, and visits siblings, ahead of where it
    // has got to, up to fixed limits. These trees are bigger than both.
    describe('walk order', () => {
        let tmpDir: string;

        function inTmp(...names: string[]): string {
            return path.join(tmpDir, ...names);
        }

        before(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filehound-'));
            for (const top of ['a', 'b', 'c']) {
                for (let i = 0; i < 30; i++) {
                    const dir = inTmp(top, `d${i}`);
                    fs.mkdirSync(dir, {recursive: true});
                    for (let j = 0; j < 70; j++) {
                        fs.writeFileSync(path.join(dir, `f${j}.${j % 2 ? 'txt' : 'json'}`), '');
                    }
                }
            }
            fs.symlinkSync(inTmp('c'), inTmp('b', 'link'), 'dir');
            fs.mkdirSync(inTmp('a', '.hidden'));
            fs.writeFileSync(inTmp('a', '.hidden', 'x.json'), '');
        });

        after(() => {
            fs.rmSync(tmpDir, {recursive: true, force: true});
        });

        const queries: Record<string, () => FileHound> = {
            'all files': () => FileHound.create().paths(tmpDir),
            'a sync matcher': () => FileHound.create().paths(tmpDir).match(ext('json')),
            // Custom filters aren't known to be sync, so are tested as needing I/O
            'a matcher needing I/O': () => FileHound.create().paths(tmpDir).match(applyFilterSync(file => file.getName().endsWith('1.txt'))),
            'directories': () => FileHound.create().paths(tmpDir).type(FileType.DIRECTORY),
            'hidden directories ignored': () => FileHound.create().paths(tmpDir).ignoreHiddenDirectories(),
            'a depth limit': () => FileHound.create().paths(tmpDir).depth(1).type(FileType.DIRECTORY, FileType.REGULAR)
        };

        for (const [name, query] of Object.entries(queries)) {
            it(`matches findSync with ${name}`, async () => {
                const expected = query().findSync();

                assert.isNotEmpty(expected);
                assert.deepEqual(await query().find(), expected);
                assert.deepEqual(await collect(query().iterate()), expected);
            });
        }

        it('rejects, without an unhandled rejection, when a directory read ahead cannot be read', async function () {
            if (process.getuid?.() === 0) {
                this.skip();
            }
            const unhandled = sinon.spy();
            process.on('unhandledRejection', unhandled);
            const locked = inTmp('c', 'd29');
            fs.chmodSync(locked, 0o000);
            try {
                // Leaving early, before reaching the unreadable directory
                for await (const file of FileHound.create().paths(tmpDir).iterate()) {
                    assert.ok(file);
                    break;
                }
                try {
                    await FileHound.create().paths(tmpDir).find();
                    assert.fail('Expected to reject!');
                } catch (err) {
                    assert.equal((err as NodeJS.ErrnoException).code, 'EACCES');
                }
                await new Promise(resolve => setTimeout(resolve, 50));
                sinon.assert.notCalled(unhandled);
            } finally {
                fs.chmodSync(locked, 0o755);
                process.off('unhandledRejection', unhandled);
            }
        });
    });

    describe('cancellation', () => {
        let tmpDir: string;

        // More directories than the walk visits and reads ahead
        before(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filehound-'));
            for (let i = 0; i < 200; i++) {
                const dir = path.join(tmpDir, `d${String(i).padStart(3, '0')}`);
                fs.mkdirSync(dir);
                for (let j = 0; j < 5; j++) {
                    fs.writeFileSync(path.join(dir, `f${j}.txt`), '');
                }
            }
        });

        after(() => {
            fs.rmSync(tmpDir, {recursive: true, force: true});
        });

        afterEach(() => {
            sandbox.restore();
        });

        async function rejection(pending: Promise<unknown>): Promise<unknown> {
            try {
                await pending;
            } catch (err) {
                return err;
            }
            return assert.fail('Expected to reject!');
        }

        it('rejects with the reason of an already aborted signal', async () => {
            const reason = new Error('stop');
            const signal = AbortSignal.abort(reason);
            const query = (): FileHound => FileHound.create().paths(tmpDir);

            assert.strictEqual(await rejection(query().find({signal})), reason);
            assert.strictEqual(await rejection(collect(query().iterate({signal}))), reason);
        });

        it('stops find when aborted, emitting no more matches, then error and end', async () => {
            const controller = new AbortController();
            const events: string[] = [];
            const fh = FileHound.create().paths(tmpDir);
            fh.on('match', () => {
                events.push('match');
                controller.abort();
            })
                .on('error', () => events.push('error'))
                .on('end', () => events.push('end'));

            const err = await rejection(fh.find({signal: controller.signal}));

            assert.equal((err as Error).name, 'AbortError');
            assert.deepEqual(events, ['match', 'error', 'end']);
        });

        it('stops iterate when aborted inside the loop', async () => {
            const controller = new AbortController();
            const found: string[] = [];

            const err = await rejection((async () => {
                for await (const file of FileHound.create().paths(tmpDir).iterate({signal: controller.signal})) {
                    found.push(file);
                    controller.abort();
                }
            })());

            assert.equal((err as Error).name, 'AbortError');
            assert.lengthOf(found, 1);
        });

        it('stops waiting on a predicate that never settles', async () => {
            const query = FileHound.create()
                .paths(tmpDir)
                .match(applyFilter(() => new Promise<boolean>(() => {})));

            const err = await rejection(query.find({signal: AbortSignal.timeout(20)}));

            assert.equal((err as Error).name, 'TimeoutError');
        });

        // Reads in flight when the search is aborted would otherwise find
        // more directories down the chain, and read those ahead too
        it('starts no more directory reads once aborted', async () => {
            const chainDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filehound-'));
            try {
                let dir = chainDir;
                fs.writeFileSync(path.join(dir, '0.txt'), '');
                for (let i = 0; i < 100; i++) {
                    dir = path.join(dir, 'a');
                    fs.mkdirSync(dir);
                }
                const readdir = sandbox.spy(fs.promises, 'readdir');
                const controller = new AbortController();
                const fh = FileHound.create().paths(chainDir).on('match', () => controller.abort());

                await rejection(fh.find({signal: controller.signal}));
                const reads = readdir.callCount;
                await new Promise(resolve => setTimeout(resolve, 50));

                assert.equal(readdir.callCount, reads);
            } finally {
                fs.rmSync(chainDir, {recursive: true, force: true});
            }
        });

        it('leaves no listeners on the signal, nor unhandled rejections', async () => {
            const unhandled = sinon.spy();
            process.on('unhandledRejection', unhandled);
            try {
                const completed = new AbortController();
                await FileHound.create().paths(tmpDir).find({signal: completed.signal});
                assert.lengthOf(getEventListeners(completed.signal, 'abort'), 0);

                const aborted = new AbortController();
                const fh = FileHound.create().paths(tmpDir).on('match', () => aborted.abort());
                await rejection(fh.find({signal: aborted.signal}));
                await new Promise(resolve => setTimeout(resolve, 50));

                assert.lengthOf(getEventListeners(aborted.signal, 'abort'), 0);
                sinon.assert.notCalled(unhandled);
            } finally {
                process.off('unhandledRejection', unhandled);
            }
        });
    });

    describe('FileView', () => {
        function viewOf(file: string): FileView {
            let view: FileView | undefined;
            FileHound.create()
                .paths(path.dirname(file))
                .match(applyFilterSync((candidate) => {
                    if (candidate.getName() === file) {
                        view = candidate;
                    }
                    return false;
                }))
                .findSync();
            return view ?? assert.fail(`${file} was not visited`);
        }

        it('gives predicates no way to change the file system, nor the walk', () => {
            const view = viewOf(justFiles[0]) as unknown as Record<string, unknown>;

            for (const method of ['delete', 'getFiles', 'getFilesSync', 'getKnownKind', 'getList', 'getListSync']) {
                assert.notProperty(view, method);
            }
        });

        it('describes the file to predicates', async () => {
            const view = viewOf(justFiles[0]);
            const stats = fs.statSync(justFiles[0]);

            assert.equal(view.getName(), justFiles[0]);
            assert.equal(view.getRelativePath(), 'a.json');
            assert.equal(view.getPathExtension(), 'json');
            assert.isTrue(view.isMatch('*.json'));
            assert.isTrue(view.isFileSync());
            assert.isFalse(await view.isDirectory());
            assert.isFalse(view.isHiddenSync());
            assert.equal(view.sizeSync(), stats.size);
            assert.equal((await view.lastModified()).getTime(), stats.mtime.getTime());
            assert.isTrue(await view.exists());
        });
    });
});
