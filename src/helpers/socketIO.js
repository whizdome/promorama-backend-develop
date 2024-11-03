/* eslint-disable consistent-return */
const socketIO = require('socket.io');
const Joi = require('joi');

const Employee = require('../models/employee.model');
const Client = require('../models/client.model');
const Agency = require('../models/agency.model');

// const redis = require('./redis');
const logger = require('../utils/customLogger');
const { ROLE } = require('./constants');

let io;

module.exports = {
  init: (httpServer) => {
    io = socketIO(httpServer, { cors: { origin: '*' } });
    return io;
  },

  get io() {
    if (!io) throw new Error('Cannot access socket.io before initialization');
    return io;
  },

  socketHandler: (socket) => {
    socket.on('setSocketId', (data) => {
      const { error } = Joi.object({
        userId: Joi.string().required(),
        role: Joi.string()
          .valid(ROLE.CLIENT, ROLE.AGENCY, ROLE.PROMOTER, ROLE.SUPERVISOR)
          .required(),
      }).validate(data);

      if (error) return socket.emit('error', error.message);

      const { userId, role } = data;

      if (role === ROLE.CLIENT) {
        Client.updateOne({ _id: userId }, { $set: { socketId: socket.id } }).catch((err) =>
          logger.error(`[SocketHandler:SetSocketId]: ${err.message}`),
        );
      } else if (role === ROLE.AGENCY) {
        Agency.updateOne({ _id: userId }, { $set: { socketId: socket.id } }).catch((err) =>
          logger.error(`[SocketHandler:SetSocketId]: ${err.message}`),
        );
      } else {
        Employee.updateOne({ _id: userId }, { $set: { socketId: socket.id } }).catch((err) =>
          logger.error(`[SocketHandler:SetSocketId]: ${err.message}`),
        );
      }
    });

    // socket.on('setSocketId', (userId) => {
    //   // redis.client.set(userId, socket.id);
    //   redis.client
    //     .hSet('socketIds', userId, socket.id)
    //     .catch((err) => logger.error(`[SocketHandler:SetSocketId]: ${err.message}`));
    // });
  },
};
