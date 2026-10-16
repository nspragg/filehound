'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copy = copy;
exports.from = from;
exports.fromFirst = fromFirst;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function copy(array) {
  return _lodash2.default.cloneDeep(array);
}

function from(_arguments) {
  if (_lodash2.default.isArray(_arguments[0])) return _arguments[0];

  return Array.prototype.slice.call(_arguments);
}

function fromFirst(_arguments) {
  return [_arguments[0]];
}