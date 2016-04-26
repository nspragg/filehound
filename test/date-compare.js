import 'babel-polyfill';

import _ from 'lodash';
import assert from 'assert';
import moment from 'moment';

import DateCompare from '../lib/date-compare';

function createDate(n, unit = 'days') {
  return moment().subtract(n, unit).format();
}

describe('DateCompare', () => {
  describe('days', () => {
    it('date equal in days', () => {
      const dc = new DateCompare('== 10 days');
      assert.strictEqual(dc.match(createDate(10)), true);
    });

    it('date less than n days', () => {
      _.range(0, 10).forEach((n) => {
        const dc = new DateCompare('<10 days');
        assert.strictEqual(dc.match(createDate(n)), true);
      });
    });

    it('date greater than in days', () => {
      _.range(0, 11).forEach((n) => {
        const dc = new DateCompare('>10 days');
        assert.strictEqual(dc.match(createDate(n)), false);
      });

      _.range(11, 20).forEach((n) => {
        const dc = new DateCompare('>10 days');
        assert.strictEqual(dc.match(createDate(n)), true);
      });
    });
  });

  describe('hours', () => {
    it('date equal in hours', () => {
      const dc = new DateCompare('10 hours');
      assert.strictEqual(dc.match(createDate(10, 'hours')), true);
    });

    it('date less than n hours', () => {
      _.range(0, 10).forEach((n) => {
        const dc = new DateCompare('<10 hours');
        assert.strictEqual(dc.match(createDate(n, 'hours')), true);
      });
    });

    it('date greater than in hours', () => {
      _.range(0, 11).forEach((n) => {
        const dc = new DateCompare('>10 hours');
        assert.strictEqual(dc.match(createDate(n, 'hours')), false);
      });

      _.range(11, 20).forEach((n) => {
        const dc = new DateCompare('>10 hours');
        assert.strictEqual(dc.match(createDate(n, 'hours')), true);
      });
    });
  });

  describe('minutes', () => {
    it('date equal in minutes', () => {
      const dc = new DateCompare('== 10 minutes');
      assert.strictEqual(dc.match(createDate(10, 'minutes')), true);
    });

    it('date less than n minutes', () => {
      _.range(0, 10).forEach((n) => {
        const dc = new DateCompare('< 10 minutes');
        assert.strictEqual(dc.match(createDate(n, 'minutes')), true);
      });
    });

    it('date greater than in minutes', () => {
      _.range(0, 11).forEach((n) => {
        const dc = new DateCompare('> 10 minutes');
        assert.strictEqual(dc.match(createDate(n, 'minutes')), false);
      });

      _.range(11, 20).forEach((n) => {
        const dc = new DateCompare('> 10 minutes');
        assert.strictEqual(dc.match(createDate(n, 'minutes')), true);
      });
    });
  });
});
