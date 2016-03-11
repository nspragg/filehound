'use strict';

const _ = require('lodash');

module.exports.negate = function (fn) {
  return function (args) {
    return !fn(args);
  };
};

module.exports.compose = (args) => {
  const functions = _.isFunction(args) ? Array.from(arguments) : args;

  return (file) => {
    let match = true;
    for (let i = 0; i < functions.length; i++) {
      match = match && functions[i](file);
    }
    return match;
  };
};
