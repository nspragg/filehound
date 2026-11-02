import { assert } from 'chai';
import * as files from '../src/files.js';

describe('Files', () => {
  describe('.notSubDirectory(subDirs)', () => {
    it('returns true when the directory is not subdirectory', () => {
      const notSubDirectory = files.notSubDirectory([
        './fixtures',
        './fixtures/nested'
      ]);
      assert.strictEqual(notSubDirectory('./fixtures/custom'), true);
    });

    it('returns false when the directory is a subdirectory', () => {
      const isSubDirectory = files.notSubDirectory([
        './fixtures',
        './fixtures/nested'
      ]);
      assert.strictEqual(isSubDirectory('./fixtures/nested'), false);
    });
  });

  describe('.isSubDirectory(base, candidate)', () => {
    it('returns true for a nested relative path', () => {
      assert.strictEqual(files.isSubDirectory('fixtures', 'fixtures/nested/deeper'), true);
    });

    it('returns true for a nested absolute path', () => {
      assert.strictEqual(files.isSubDirectory('/a', '/a/b/c'), true);
    });

    it('returns false for a sibling', () => {
      assert.strictEqual(files.isSubDirectory('/a/b', '/a/c'), false);
    });
  });
});
