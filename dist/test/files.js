"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const files = require("../src/files");
describe('Files', () => {
    describe('.notSubDirectory(subDirs)', () => {
        it('returns true when the directory is not subdirectory', () => {
            const notSubDirectory = files.notSubDirectory([
                './fixtures',
                './fixtures/nested'
            ]);
            chai_1.assert.strictEqual(notSubDirectory('./fixtures/custom'), true);
        });
        it('returns false when the directory is a subdirectory', () => {
            const isSubDirectory = files.notSubDirectory([
                './fixtures',
                './fixtures/nested'
            ]);
            chai_1.assert.strictEqual(isSubDirectory('./fixtures/nested'), false);
        });
    });
    describe('.getRoot', () => {
        it('returns the root of a given path', () => {
            const root = files.getRoot('/a/b/c');
            chai_1.assert.equal('/', root);
        });
    });
});
//# sourceMappingURL=files.js.map