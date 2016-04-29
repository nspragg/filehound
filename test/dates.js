import assert from 'assert';

import {
  normalise
} from '../lib/dates';

describe('dates', () => {
  describe('unit normalisation', () => {
    it('returns hours when given h', () => {
      assert.equal(normalise('h'), 'hours');
    });

    it('returns hours when given hour', () => {
      assert.equal(normalise('hour'), 'hours');
    });

    it('returns days when given d', () => {
      assert.equal(normalise('d'), 'days');
    });

    it('returns days when given day', () => {
      assert.equal(normalise('day'), 'days');
    });

    it('returns minutes when given min', () => {
      assert.equal(normalise('min'), 'minutes');
    });

    it('returns minutes when given mins', () => {
      assert.equal(normalise('mins'), 'minutes');
    });

    it('returns minutes when given m', () => {
      assert.equal(normalise('m'), 'minutes');
    });

    it('returns minutes when given minute', () => {
      assert.equal(normalise('minute'), 'minutes');
    });
  });
});
