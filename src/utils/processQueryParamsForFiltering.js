const { DB_FILTERING_EXCLUDED_PROPS } = require('../helpers/constants');

const processQueryParamsForFiltering = (reqQuery) => {
  const queryObj = { ...reqQuery };
  const excludedFields = DB_FILTERING_EXCLUDED_PROPS || [];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt|eq|ne|in|nin)\b/g, (match) => `$${match}`);

  return JSON.parse(queryStr);
};

module.exports = processQueryParamsForFiltering;
