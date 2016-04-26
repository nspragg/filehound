import moment from 'moment';

import {
  normalise
} from './dates';

const pattern = new RegExp('(<=|>=|<|>|==?)?\s*(.*?)\s*([a-z]*)?\s*$');

function toSeconds(value, u) {
  switch (u) {
    case 'days':
      return (24 * (60 * 60)) * value;
    case 'hours':
      return (60 * 60) * value;
    case 'minutes':
      return 60 * value;
  }
}

class DateCompare {
  constructor(dateExpression) {
    const matches = pattern.exec(dateExpression);
    this.value = parseInt(matches[2] || 0);
    this.operator = matches[1] || '==';
    this.unit = normalise(matches[3] || 'days');

    this.targetDate = moment().subtract(this.value, this.unit);
    this.targetInSeconds = toSeconds(this.value, this.unit);
  }

  match(date) {
    const modified = moment(date);
    const unitDifference = moment(this.targetDate.format()).diff(modified, 'seconds');

    let result;
    switch (this.operator) {
      case '<':
        result = unitDifference < 0;
        break;
      case '>':
        result = unitDifference > 0;
        break;
      case '==':
      default:
        result = unitDifference === 0;
    }

    return result;
  }
}

export default DateCompare;
