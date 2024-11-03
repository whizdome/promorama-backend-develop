/* eslint-disable prefer-destructuring */
const { promisify } = require('util');
const httpError = require('http-errors');
const jwt = require('jsonwebtoken');

const Employee = require('../models/employee.model');
const Admin = require('../models/admin.model');
const Client = require('../models/client.model');
const Agency = require('../models/agency.model');
const Subuser = require('../models/subuser.model');

const { ROLE } = require('../helpers/constants');

const roleModelMap = {
  [ROLE.PROMOTER]: Employee,
  [ROLE.SUPERVISOR]: Employee,
  [ROLE.SUPER_ADMIN]: Admin,
  [ROLE.ADMIN]: Admin,
  [ROLE.CLIENT]: Client,
  [ROLE.AGENCY]: Agency,
  [ROLE.BASIC_SUBUSER]: Subuser,
};

/** A middleware to protect routes from unauthenticated users */
const isLoggedIn = async (req, res, next) => {
  /* Get token from authorization header */
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new httpError.Unauthorized('You are not logged in! Please log in to get access');
  }

  /* Verify token */
  const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  /* Check if the user still exists */
  const UserModel = roleModelMap[decodedToken.role];
  if (!UserModel) throw new httpError.Unauthorized('Invalid user role');

  const user = await UserModel.findById(decodedToken.id);
  if (!user) throw new httpError.Unauthorized('The user assigned this token does no longer exist');

  /* Grant user access to protected routes */
  req.user = user;

  next();
};

/** A middleware to grant access to specific user roles */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new httpError.Unauthorized('You are not logged in! Please log in to get access');
    }

    if (!roles.includes(req.user.role)) {
      throw new httpError.Forbidden('You do not have the permission to perform this action');
    }

    next();
  };

module.exports = { isLoggedIn, authorize };
