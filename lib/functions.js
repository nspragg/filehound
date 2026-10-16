'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.negate = negate;
exports.compose = compose;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function negate(fn) {
  return function (args) {
    return !fn(args);
  };
}

function compose(args) {
  var functions = _lodash2.default.isFunction(args) ? Array.from(arguments) : args;

  return function (file) {
    var match = true;
    for (var i = 0; i < functions.length; i++) {
      if (!match) return false;
      match = match && functions[i](file);
    }
    return match;
  };
}