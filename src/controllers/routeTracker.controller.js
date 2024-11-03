const Joi = require('joi');
const httpError = require('http-errors');

const routeTrackerService = require('../services/routeTracker.service');

const addNewData = async (req, res) => {
  const { error } = Joi.object({
    latitude: Joi.number().options({ convert: false }).required(),
    longitude: Joi.number().options({ convert: false }).required(),
  }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await routeTrackerService.addNewData({
    user: req.user.id,
    date: new Date().toISOString().split('T')[0],
    ...req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Data added successfully',
  });
};

const getAllData = async (req, res) => {
  const data = await routeTrackerService.getAllData(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Data retrieved successfully',
    data,
  });
};

module.exports = {
  addNewData,
  getAllData,
};
