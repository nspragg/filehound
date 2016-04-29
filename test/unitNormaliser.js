'use strict';

import assert from 'assert';

import Normaliser from '../lib/unitNormaliser';

describe('unit normalisation', () => {
  let normaliser;

  beforeEach(() => {
    normaliser = new Normaliser();
    normaliser.addAlias('myname', 'myalias');
  });

  describe('.normalise', () => {
    it('returns name for a given alias', () => {
      assert.equal(normaliser.normalise('myalias'), 'myname');
    });

    it('returns name for an alternative alias', () => {
      normaliser.addAlias('myname', 'anotheralias');
      assert.equal(normaliser.normalise('anotheralias'), 'myname');
    });

    it('ignores case', () => {
      assert.equal(normaliser.normalise('MyAlias'), 'myname');
    });

    it('returns undefined when alias is absent', () => {
      assert.equal(normaliser.normalise(), undefined);
    });
  })

  describe('.addAlias', () => {
    it('throws if the name is undefined', () => {
      assert.throws(
        () => {
          normaliser.addAlias(undefined, 'myalias')
        },
        /absent name!/
      );
    });

    it('throws if the alias is undefined', () => {
      assert.throws(
        () => {
          normaliser.addAlias('myname', undefined)
        },
        /absent alias!/
      );
    });
  });
});
