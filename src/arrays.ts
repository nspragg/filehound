import * as _ from 'lodash';

export function copy<T>(value: T): T {
  return _.cloneDeep(value);
}

export function from(args: any[]) {
  if (_.isArray(args[0])) {
    return args[0];
  }
  return Array.prototype.slice.call(args);
}
