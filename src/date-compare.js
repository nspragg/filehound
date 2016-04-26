import moment from 'moment';

const pattern = new RegExp('(<=|>=|<|>|==?)?\s*(.*?)\s*(hours|days|minutes)?\s*$');

class DateCompare {
  constructor(dateExpression) {
    const matches = pattern.exec(dateExpression);
    this.value = parseInt(matches[2] || 0);
    this.operator = matches[1] || '==';
    this.unit = matches[3] || 'days';

    this.targetDate = moment().subtract(this.value, this.unit);
  }

  match(date) {
    const modified = moment(date);
    const unitDifference = moment(this.targetDate.format()).diff(modified, this.unit);

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
