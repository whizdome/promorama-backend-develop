const RouteTracker = require('../models/routeTracker.model');

const APIFeatures = require('../utils/apiFeatures');

const addNewData = async (data) => {
  return RouteTracker.create(data);
};

const getAllData = (reqQuery) => {
  const apiFeatures = new APIFeatures(RouteTracker.find({}), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  return apiFeatures.query;
};

module.exports = {
  addNewData,
  getAllData,
};
