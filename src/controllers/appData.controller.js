const Joi = require('joi');
const httpError = require('http-errors');

const appDataService = require('../services/appData.service');

const updateAppData = async (req, res) => {
  const { error } = Joi.object({
    currentAndroidVersion: Joi.string(),
    currentIosVersion: Joi.string(),
  })
    .min(1)
    .validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await appDataService.updateAppData(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'App data updated successfully',
    data,
  });
};

const getAppData = async (req, res) => {
  const data = await appDataService.getAppData();

  return res.status(200).send({
    status: 'success',
    message: 'App data retrieved successfully',
    data,
  });
};

module.exports = {
  updateAppData,
  getAppData,
};
