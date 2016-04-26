import 'babel-polyfill';

import assert from 'assert';
import ValueCompare from '../lib/value-compare';

describe('ValueCompare', () => {
  it('returns true for matching a expression', () => {
    const cmp = new ValueCompare(10);
    assert.strictEqual(cmp.match(10), true);
  });

  it('returns false for when an expression does not match', () => {
    const cmp = new ValueCompare(100);
    assert.strictEqual(cmp.match(10), false);
  });

  it('supports less than comparisons', () => {
    const cmp = new ValueCompare('<10');
    assert.strictEqual(cmp.match(9), true);
  });

  it('supports less than or equal to comparisons', () => {
    const cmp = new ValueCompare('<=10');
    assert.strictEqual(cmp.match(9), true);
  });

  it('supports greater than comparisons', () => {
    const cmp = new ValueCompare('>10');
    assert.strictEqual(cmp.match(11), true);
  });

  it('supports greater or equal than comparisons', () => {
    const cmp = new ValueCompare('>=10');
    assert.strictEqual(cmp.match(11), true);
  });

  it('ignores whitespace', () => {
    const cmp = new ValueCompare('>=   10 ');
    assert.strictEqual(cmp.match(11), true);
  });

  it('magnifies kilobytes', () => {
    const cmp = new ValueCompare('10kb');
    assert.strictEqual(cmp.match(10240), true);
  });

  it('magnifies megabytes', () => {
    const cmp = new ValueCompare('10m');
    assert.strictEqual(cmp.match(10485760), true);
  });

  it('magnifies gigabytes', () => {
    const cmp = new ValueCompare('10g');
    assert.strictEqual(cmp.match(10737418240), true);
  });

  it('magnifies terabytes', () => {
    const cmp = new ValueCompare('10t');
    assert.strictEqual(cmp.match(10995116277760), true);
  });
});
