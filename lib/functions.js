'use strict';

module.exports.negate = function (fn) {
  return function (args) {
    return !fn(args);
  };
};
