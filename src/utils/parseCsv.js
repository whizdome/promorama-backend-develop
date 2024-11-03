const csv = require('fast-csv');
const httpError = require('http-errors');
const logger = require('./customLogger');

const parseCsv = (buffer, options = {}, validateRow = null, transformRow = null) => {
  return new Promise((resolve, reject) => {
    const results = [];

    // Set default options and override with any provided options
    const csvOptions = {
      headers: true,
      discardUnmappedColumns: true,
      quote: null,
      ignoreEmpty: true,
      trim: true,
      ...options,
    };

    // Parse CSV data from buffer
    csv
      .parseString(buffer.toString('utf-8'), csvOptions)
      .transform((data, cb) =>
        transformRow ? setImmediate(() => cb(null, transformRow(data))) : cb(null, data),
      )
      .validate((data, cb) =>
        validateRow ? setImmediate(() => cb(null, validateRow(data))) : cb(null, true),
      )
      .on('data', (row) => results.push(row))
      .on('data-invalid', (row, rowNumber) =>
        logger.info(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`),
      )
      .on('error', (err) => {
        logger.error('Error parsing CSV:', err);
        reject(new httpError.UnprocessableEntity('CSV file could not be parsed'));
      })
      .on('end', () => {
        resolve(results);
      });
  });
};

module.exports = { parseCsv };
