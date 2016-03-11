'use strict';

const _ = require('lodash');

module.exports.copy = (array) => {
  return _.cloneDeep(array);
};
