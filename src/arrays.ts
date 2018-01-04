import * as _ from 'lodash';

export function copy<T>(value: T) {
  return _.cloneDeep(value);
}

export function from(args: string[]) {
  if (_.isArray(args[0])) {
    return args[0];
  }
  return Array.prototype.slice.call(args);
}
