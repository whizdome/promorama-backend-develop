/* eslint-disable no-unused-vars */
const logger = require('../utils/customLogger');

/** Global error handler */
const globalErrorHandler = (err, req, res, next) => {
  /* Bad JSON request body */
  if (err.type === 'entity.parse.failed') {
    return res.status(400).send({
      status: 'error',
      message: 'Bad JSON request body',
    });
  }

  /* Mongoose bad ObjectID */
  if (err.name === 'CastError') {
    return res.status(400).send({
      status: 'error',
      message: 'Invalid resource ID',
    });
  }

  /* Mongoose duplicate key value */
  if (err.code === 11000) {
    const keyVal = Object.keys(err.keyValue)[0];
    return res.status(400).send({
      status: 'error',
      message: `${keyVal} already exist`,
    });
  }

  /* Mongoose validation error */
  if (err.name === 'ValidationError') {
    const messageArr = Object.values(err.errors).map((value) => value.message);
    return res.status(400).send({
      status: 'error',
      message: `Invalid input data: ${messageArr.join(', ')}`,
    });
  }

  /* Jwt invalid token error */
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).send({
      status: 'error',
      message: 'Invalid token. Please log in again!',
    });
  }

  /* Jwt expired token error */
  if (err.name === 'TokenExpiredError') {
    return res.status(401).send({
      status: 'error',
      message: 'Your token has expired. Please log in again!',
    });
  }

  /* Incorrect upload field name error */
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).send({
      status: 'error',
      message: 'Please specify the correct upload field name',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).send({
      status: 'error',
      message: 'File too large',
    });
  }

  const statusCode = err.statusCode === 200 ? 500 : err.statusCode || 500;
  const message = `${statusCode}`.startsWith('4') ? err.message : 'Something went wrong!';

  /* Log the errors we didn't handle */
  if (statusCode === 500) logger.error(`[GlobalErrorHandler]: ${err.message}- Stack: ${err.stack}`);

  return res.status(statusCode).send({ status: 'error', message });
};

/** Handles request to routes that are not available on the server */
const unhandledRoutes = (req, res, next) => {
  return res.status(404).send({
    status: 'error',
    message: `${req.method} request to: ${req.originalUrl} not available on this server!`,
  });
};

module.exports = { globalErrorHandler, unhandledRoutes };
