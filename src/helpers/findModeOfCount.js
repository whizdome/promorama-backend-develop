/* eslint-disable no-restricted-syntax */
const findModeOfCounts = (counts) => {
  const countMap = new Map();
  let maxCount = 0;
  let mode = null;

  counts.forEach((count) => {
    const currentCount = countMap.get(count) || 0;
    countMap.set(count, currentCount + 1);

    if (currentCount + 1 > maxCount) {
      maxCount = currentCount + 1;
      mode = count;
    }
  });

  return mode;
};

module.exports = { findModeOfCounts };
