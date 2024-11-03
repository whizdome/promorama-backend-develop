const httpError = require('http-errors');
const geolib = require('geolib');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const Store = require('../models/store.model');
const Attendance = require('../models/attendance.model');

const { CLOCK_IN_MIN_DIST_METERS } = require('../helpers/constants');
const APIFeatures = require('../utils/apiFeatures');

const clockIn = async (data) => {
  const { initiativeStoreId, currentUser, latitude, longitude } = data;

  const currentDate = new Date().toISOString().slice(0, 10);

  const existingClockIn = await Attendance.findOne({
    user: currentUser.id,
    clockInDate: { $eq: currentDate }, // Match current date
    clockOutTime: null, // Not clocked out yet
  });

  if (existingClockIn) {
    throw new httpError.BadRequest('You currently have an active clock-in for today');
  }

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId);
  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (
    currentUser.id !== initiativeStore.promoter.toString() &&
    currentUser.id !== initiativeStore.supervisor.toString()
  ) {
    throw new httpError.BadRequest('You are not assigned to this initiative store');
  }

  const store = await Store.findById(initiativeStore.store);
  if (!store) throw new httpError.NotFound('Store not found');

  // Calculate the distance between user and store
  const distance = geolib.getDistance(
    { latitude, longitude },
    { latitude: store.location.coordinates[1], longitude: store.location.coordinates[0] },
  );

  if (distance > CLOCK_IN_MIN_DIST_METERS) {
    throw new httpError.BadRequest(
      `You are not within ${CLOCK_IN_MIN_DIST_METERS} meters of the store`,
    );
  }

  return Attendance.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    clockInDate: currentDate,
  });
};

const clockOut = async (userId, clockOutTime) => {
  // Find the most recent clock-in entry for the user on the current date
  const existingClockIn = await Attendance.findOne({
    user: userId,
    clockInDate: { $eq: new Date().toISOString().slice(0, 10) }, // Match current date
    clockOutTime: null, // Not clocked out yet
  });

  if (!existingClockIn) {
    throw new httpError.BadRequest('You are not currently clocked-in');
  }

  if (new Date(clockOutTime) < existingClockIn.clockInTime) {
    throw new httpError.BadRequest('Invalid clock-out time');
  }

  // Calculate the time difference in milliseconds
  const timeDifference = new Date(clockOutTime) - existingClockIn.clockInTime;

  // Calculate hours worked by dividing by milliseconds/hour - 1000 * 60 * 60
  const hoursWorked = timeDifference / (1000 * 60 * 60);

  existingClockIn.clockOutTime = clockOutTime;
  existingClockIn.hoursWorked = hoursWorked.toFixed(2);
  return existingClockIn.save();
};

const getAttendances = (reqQuery) => {
  const apiFeatures = new APIFeatures(Attendance.find({}), reqQuery)
    .filter()
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: {
        path: 'store',
        select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
      },
    })
    .populate({ path: 'user', select: 'firstName lastName email phoneNumber profilePicture role' });

  return apiFeatures.query;
};

const getCurrentClockIn = (userId) => {
  return Attendance.findOne({
    user: userId,
    clockInDate: { $eq: new Date().toISOString().slice(0, 10) }, // Match current date
    clockOutTime: null, // Not clocked out yet
  });
};

const getAggregateAttendances = async (reqQuery) => {
  const { initiativeId, date } = reqQuery;

  const aggregateResult = await Attendance.aggregate([
    {
      $match: { initiative: new mongoose.Types.ObjectId(initiativeId), clockInDate: date },
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        totalHoursWorked: { $sum: '$hoursWorked' },
        // totalHoursWorked: { $sum: { $toDouble: '$hoursWorked' } },
      },
    },
    {
      $lookup: {
        from: 'initiative_stores',
        localField: '_id.initiativeStore',
        foreignField: '_id',
        as: 'initiativeStore',
      },
    },
    {
      $lookup: {
        from: 'stores',
        localField: 'initiativeStore.store',
        foreignField: '_id',
        as: 'store',
        pipeline: [
          {
            $project: {
              name: 1,
              streetNumber: 1,
              streetName: 1,
              state: 1,
              area: 1,
              town: 1,
              ownerFirstName: 1,
              ownerLastName: 1,
              ownerPhoneNumber: 1,
              imageURL: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$store',
    },
    {
      $lookup: {
        from: 'employees',
        localField: 'initiativeStore.promoter',
        foreignField: '_id',
        as: 'promoter',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
              profilePicture: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$promoter',
    },
    {
      $lookup: {
        from: 'employees',
        localField: 'initiativeStore.supervisor',
        foreignField: '_id',
        as: 'supervisor',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
              profilePicture: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$supervisor',
    },
    {
      $sort: { totalHoursWorked: -1 },
    },
    {
      $project: {
        _id: 0,
        initiativeStoreId: '$_id.initiativeStore',
        totalHoursWorked: { $round: ['$totalHoursWorked', 2] },
        store: 1,
        promoter: 1,
        supervisor: 1,
      },
    },
  ]);

  return {
    date,
    aggregateResult,
  };
};

const getUserAggregateAttendances = async (reqQuery) => {
  const { initiativeId, userId, startDate, endDate } = reqQuery;

  const aggregateResult = await Attendance.aggregate([
    {
      $match: {
        initiative: new mongoose.Types.ObjectId(initiativeId),
        user: new mongoose.Types.ObjectId(userId),
        clockInDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { clockInDate: '$clockInDate', initiativeStore: '$initiativeStore' },
        totalHoursWorked: { $sum: '$hoursWorked' },
      },
    },
    {
      $lookup: {
        from: 'initiative_stores',
        localField: '_id.initiativeStore',
        foreignField: '_id',
        as: 'initiativeStore',
      },
    },
    {
      $lookup: {
        from: 'stores',
        localField: 'initiativeStore.store',
        foreignField: '_id',
        as: 'store',
        pipeline: [
          {
            $project: {
              name: 1,
              streetNumber: 1,
              streetName: 1,
              state: 1,
              area: 1,
              town: 1,
              ownerFirstName: 1,
              ownerLastName: 1,
              ownerPhoneNumber: 1,
              imageURL: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$store',
    },
    {
      $sort: { '_id.clockInDate': 1 },
    },
    {
      $project: {
        _id: 0,
        initiativeStoreId: '$_id.initiativeStore',
        clockInDate: '$_id.clockInDate',
        store: 1,
        totalHoursWorked: { $round: ['$totalHoursWorked', 2] },
      },
    },
  ]);

  return {
    startDate,
    endDate,
    aggregateResult,
  };
};

const getUsersDailyAggregateAttendances = async (reqQuery) => {
  const { initiativeId, startDate, endDate } = reqQuery;

  const aggregateResult = await Attendance.aggregate([
    {
      $match: {
        initiative: new mongoose.Types.ObjectId(initiativeId),
        clockInDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { clockInDate: '$clockInDate', user: '$user' },
        totalHoursWorked: { $sum: '$hoursWorked' },
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id.user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
              profilePicture: 1,
              role: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$user',
    },
    {
      $sort: { '_id.clockInDate': 1 },
    },
    {
      $project: {
        _id: 0,
        clockInDate: '$_id.clockInDate',
        user: 1,
        totalHoursWorked: { $round: ['$totalHoursWorked', 2] },
      },
    },
  ]);

  return {
    startDate,
    endDate,
    aggregateResult,
  };
};

const getUsersTotalAggregateAttendances = async (reqQuery) => {
  const { initiativeId, startDate, endDate } = reqQuery;

  const aggregateResult = await Attendance.aggregate([
    {
      $match: {
        initiative: new mongoose.Types.ObjectId(initiativeId),
        clockInDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { user: '$user' },
        totalHoursWorked: { $sum: '$hoursWorked' },
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id.user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
              profilePicture: 1,
              role: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$user',
    },
    {
      $sort: { totalHoursWorked: -1 },
    },
    {
      $project: {
        _id: 0,
        user: 1,
        totalHoursWorked: { $round: ['$totalHoursWorked', 2] },
      },
    },
  ]);

  return {
    startDate,
    endDate,
    aggregateResult,
  };
};

const addTrackingData = async (data) => {
  const { attendanceId, location, geofenceEvent } = data;

  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) throw new httpError.NotFound('Attendance not found');

  if (location) attendance.locations.push(location);
  if (geofenceEvent) attendance.geofenceEvents.push(geofenceEvent);

  await attendance.save();

  return attendance;
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
