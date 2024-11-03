const Joi = require('joi');
const httpError = require('http-errors');

const attendanceService = require('../services/attendance.service');

const clockIn = async (req, res) => {
  const { error } = Joi.object({
    deviceId: Joi.string().required(),
    latitude: Joi.number().options({ convert: false }).required(),
    longitude: Joi.number().options({ convert: false }).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  if (req.body.deviceId !== req.user.deviceId) {
    throw new httpError.BadRequest('You can only clock-in from the device linked to this account');
  }

  await attendanceService.clockIn({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    ...req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Clock-in successfully',
  });
};

const clockOut = async (req, res) => {
  const { error } = Joi.object({ clockOutTime: Joi.date().iso().required() }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await attendanceService.clockOut(req.user.id, req.body.clockOutTime);

  return res.status(200).send({
    status: 'success',
    message: 'Clock-out successfully',
  });
};

const getAttendances = async (req, res) => {
  const attendances = await attendanceService.getAttendances(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Attendances retrieved successfully',
    data: attendances,
  });
};

const getCurrentClockIn = async (req, res) => {
  const currentClockIn = await attendanceService.getCurrentClockIn(req.user.id);

  return res.status(200).send({
    status: 'success',
    message: currentClockIn ? 'Currently clocked-in' : 'Not currently clocked-in',
    data: currentClockIn,
  });
};

const getAggregateAttendances = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    date: Joi.date().iso().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await attendanceService.getAggregateAttendances(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Attendances aggregate retrieved successfully',
    data,
  });
};

const getUserAggregateAttendances = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().min(24).max(24).required(),
    userId: Joi.string().min(24).max(24).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await attendanceService.getUserAggregateAttendances(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Attendances aggregate retrieved successfully',
    data,
  });
};

const getUsersDailyAggregateAttendances = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().min(24).max(24).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await attendanceService.getUsersDailyAggregateAttendances(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Attendances aggregate retrieved successfully',
    data,
  });
};

const getUsersTotalAggregateAttendances = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().min(24).max(24).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await attendanceService.getUsersTotalAggregateAttendances(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Attendances aggregate retrieved successfully',
    data,
  });
};

const addTrackingData = async (req, res) => {
  const { error } = Joi.object({
    location: Joi.object({
      latitude: Joi.number().options({ convert: false }).required(),
      longitude: Joi.number().options({ convert: false }).required(),
      timestamp: Joi.date().iso().required(),
    }),
    geofenceEvent: Joi.object({
      event: Joi.string().required(),
      timestamp: Joi.date().iso().required(),
    }),
  })
    .min(1)
    .validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await attendanceService.addTrackingData({ attendanceId: req.params.attendanceId, ...req.body });

  return res.status(200).send({
    status: 'success',
    message: 'Tracking data added successfully',
  });
};

module.exports = {
  clockIn,
  clockOut,
  getAttendances,
  getCurrentClockIn,
  getAggregateAttendances,
  getUserAggregateAttendances,
  getUsersDailyAggregateAttendances,
  getUsersTotalAggregateAttendances,
  addTrackingData,
};
