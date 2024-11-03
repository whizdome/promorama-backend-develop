const getDateDifferenceInDays = (minDate, maxDate) => {
  const startDate = new Date(new Date(minDate).toISOString().slice(0, 10));
  const endDate = new Date(new Date(maxDate).toISOString().slice(0, 10));

  const differenceInMilliseconds = Math.abs(endDate - startDate);
  const millisecondsInADay = 1000 * 60 * 60 * 24;
  const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsInADay);

  return differenceInDays;
};

module.exports = getDateDifferenceInDays;
