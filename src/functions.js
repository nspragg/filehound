import _ from 'lodash';

export function negate(fn) {
  return function (args) {
    return !fn(args);
  };
};

export function compose(args) {
  const functions = _.isFunction(args) ? Array.from(arguments) : args;

  return (file) => {
    let match = true;
    for (let i = 0; i < functions.length; i++) {
      match = match && functions[i](file);
    }
    return match;
  };
};
