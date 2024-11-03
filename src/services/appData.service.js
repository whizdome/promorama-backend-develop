const AppData = require('../models/appData.model');

const updateAppData = async (data) => {
  const appData = await AppData.findOneAndUpdate({}, data, { new: true, upsert: true });

  return appData;
};

const getAppData = async () => {
  const appData = await AppData.findOne();

  return appData;
};

module.exports = {
  updateAppData,
  getAppData,
};
