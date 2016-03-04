module.exports.negate = function (fn) {
  return function (arguments) {
    return !fn(arguments);
  };
};
