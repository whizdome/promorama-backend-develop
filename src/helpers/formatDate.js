function formatDate(date) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayOfWeek = daysOfWeek[date.getDay()]; // Get abbreviated day name
  const month = months[date.getMonth()]; // Get full month name
  const dayOfMonth = date.getDate(); // Get day of the month
  const year = date.getFullYear(); // Get full year

  // Construct the formatted date string
  return `${dayOfWeek}-${month}/${dayOfMonth}/${year}`;
}

module.exports = { formatDate };
