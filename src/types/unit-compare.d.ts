// unit-compare ships without types; this covers only what the matchers use
declare module 'unit-compare' {
  type Assertion = {assert(expression: string | number): boolean};

  export function isDate(date: Date): Assertion;
  export function isNumber(number: number): Assertion;
}
