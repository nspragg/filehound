'use strict';

module.exports.negate = function (fn) {
  return function () {
    return !fn(arguments);
  };
};
