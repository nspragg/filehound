import _ from 'lodash';

export function copy(array) {
  return _.cloneDeep(array);
}
