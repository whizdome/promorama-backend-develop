const isCsvFile = (file) => {
  return (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' || // Some browsers use this mimetype
    file.originalname.endsWith('.csv')
  );
};

module.exports = { isCsvFile };
