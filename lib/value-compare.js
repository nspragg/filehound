'use strict';

const bytes = 'b';
const kiloBytes = 'k';
const megaBytes = 'm';
const gigaBytes = 'g';
const teraBytes = 't';

function isDefined(value) {
  return value !== undefined;
}

class ValueCompare {
  constructor(expression) {
    const matches = new RegExp('(<=|>=|<|>|==?)?(.*?)([kmgt]b?)?$').exec(expression);
    const unit = matches[3] || bytes;

    this.comparator = matches[1];
    this.value = isDefined(matches[2]) ? parseInt(matches[2]) : 0;

    if (unit === kiloBytes) this.value *= 1024;
    if (unit === megaBytes) this.value *= 1024 * 1024;
    if (unit === gigaBytes) this.value *= 1024 * 1024 * 1024;
    if (unit === teraBytes) this.value *= 1024 * 1024 * 1024 * 1024;
  }

  match(number) {
    let match = false;
    switch (this.comparator) {
    case '>':
      match = isDefined(number) && (number > this.value);
      break;
    case '>=':
      match = isDefined(number) && (number >= this.value);
      break;
    case '<':
      match = isDefined(number) && (number < this.value);
      break;
    case '<=':
      match = isDefined(number) && (number <= this.value);
      break;
    case '==':
    default:
      match = isDefined(number) && (number === this.value);
    }

    return match;
  }
}

module.exports = ValueCompare;
