import * as _ from 'lodash';

export function copy(array) {
  return _.cloneDeep(array);
}

export function from(args: Array<String>) {
  if (_.isArray(args[0])) return args[0];

  return Array.prototype.slice.call(args);
}
