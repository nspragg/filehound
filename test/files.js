import assert from 'assert';
import * as files from '../lib/files';

describe('Files', () => {
  describe('.notSubDirectory(subDirs)', () => {
    it('returns true when the directory is not subdirectory', () => {
      const notSubDirectory = files.notSubDirectory(['./fixtures', './fixtures/nested']);
      assert.strictEqual(notSubDirectory('./fixtures/custom'), true);
    });

    it('returns false when the directory is a subdirectory', () => {
      const isSubDirectory = files.notSubDirectory(['./fixtures', './fixtures/nested']);
      assert.strictEqual(isSubDirectory('./fixtures/nested'), false);
    });

    it('returns the depth of a given path', () => {
      const path = '/a/b/c';
      assert.equal(files.pathDepth(path), 4);
    });
  });

  describe('.isVisibleFile(path)', () => {
    it('returns false when the file is hidden', () => {
      assert.strictEqual(files.isVisibleFile('/test/path/.hidden.json'), false);
      assert.strictEqual(files.isVisibleFile('.hidden.json'), false);
      assert.strictEqual(files.isVisibleFile('.hidden'), false);
    });

    it('returns true when the file is visible', () => {
      assert.strictEqual(files.isVisibleFile('/test/path/visible.json'), true);
      assert.strictEqual(files.isVisibleFile('./test/path/visible.json'), true);
      assert.strictEqual(files.isVisibleFile('../test/path/visible.json'), true);
      assert.strictEqual(files.isVisibleFile('visible'), true);
      assert.strictEqual(files.isVisibleFile('/.hidden/visible'), true);
    });
  });
});
