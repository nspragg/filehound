import * as _ from 'lodash';

export function negate(fn: (args: any) => boolean) {
  return function(args: any): boolean {
    return !fn(args);
  };
}

export function compose(args) {
  const functions = _.isFunction(args) ? Array.from(arguments) : args;

  return file => {
    let match = true;
    for (let i = 0; i < functions.length; i++) {
      match = match && functions[i](file);
    }
    return match;
  };
}
