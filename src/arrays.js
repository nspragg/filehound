import _ from 'lodash';

export function copy(array) {
  return _.cloneDeep(array);
}

export function from(_arguments) {
  return Array.prototype.slice.call(_arguments);
}

export function fromFirst(_arguments) {
  return [_arguments[0]];
}
