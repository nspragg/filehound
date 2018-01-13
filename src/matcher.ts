import * as _ from 'lodash';
import * as File from 'file-js';
import bind from './bind';

export class Matcher {
  private filters: ((args: any) => any)[];
  private negate: boolean;

  public constructor() {
    this.filters = [];
    this.negate = false;
    bind(this);
  }

  public on(filter): Matcher {
    this.filters.push(filter);
    return this;
  }

  public static negate(fn: (args: any) => boolean) {
    return function (args: any): boolean {
      return !fn(args);
    };
  }

  public static isMatch(pattern: string): (file: File) => boolean {
    return (file) => {
      return new RegExp(pattern).test(file.getName());
    };
  }

  public negateAll() {
    this.negate = true;
    return this;
  }

  public static compose(args) {
    const functions = _.isFunction(args) ? Array.from(arguments) : args;

    return (file) => {
      let match = true;
      /* tslint:disable:no-increment-decrement */
      for (let i = 0; i < functions.length; i++) {
        match = match && functions[i](file);
      }
      return match;
    };
  }

  create(): (args: any) => boolean {
    const isMatch = Matcher.compose(this.filters);
    if (this.negate) {
      return Matcher.negate(isMatch);
    }
    return isMatch;
  }
}

export default Matcher;
