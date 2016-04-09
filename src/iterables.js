'use strict';

module.exports.toArray = (iter) => {
  const copy = [];
  for (const path of iter) {
    copy.push(path);
  }
  return copy;
};
