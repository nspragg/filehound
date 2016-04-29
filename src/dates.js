import Normaliser from './unitNormaliser';

const normaliser = new Normaliser();
normaliser.addAlias('hours', 'hour');
normaliser.addAlias('hours', 'h');
normaliser.addAlias('days', 'd');
normaliser.addAlias('days', 'day');
normaliser.addAlias('minutes', 'm');
normaliser.addAlias('minutes', 'minute');
normaliser.addAlias('minutes', 'min');
normaliser.addAlias('minutes', 'mins');

export function normalise(name) {
  return normaliser.normalise(name);
}
