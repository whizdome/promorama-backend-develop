const crypto = require('crypto');
const httpError = require('http-errors');
const { startSession } = require('mongoose');

const Employee = require('../models/employee.model');
const Admin = require('../models/admin.model');
const Client = require('../models/client.model');
const Invite = require('../models/invite.model');
const Agency = require('../models/agency.model');
const Subuser = require('../models/subuser.model');

const logger = require('../utils/customLogger');

const { sendEmailVerificationToken } = require('../helpers/email');
const handlerFactory = require('../helpers/handlerFactory');

const signUp = async (data) => {
  const { firstName, email, role, inviteId, agencyId, clientId } = data;

  const invite = await Invite.findOne({ inviteId, role, emails: { $in: email } });
  if (!invite) throw new httpError.BadRequest('Invalid invite');

  const session = await startSession();
  try {
    session.startTransaction();

    const employee = new Employee(data);
    const token = employee.generateEmailVerificationToken();
    await employee.save({ session });

    if (agencyId) {
      const agency = await Agency.findById(agencyId);
      if (!agency) throw new httpError.NotFound('Agency not found');
      if (agency.isDeleted) throw new httpError.BadRequest('Agency has been marked as deleted');

      await Agency.updateOne(
        { _id: agency.id },
        { $addToSet: { employees: employee } },
        { session },
      );
    }

    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) throw new httpError.NotFound('Client not found');
      if (client.isDeleted) throw new httpError.BadRequest('Client has been marked as deleted');

      await Client.updateOne(
        { _id: client.id },
        { $addToSet: { employees: employee } },
        { session },
      );
    }

    sendEmailVerificationToken({ name: firstName, email, token }).catch((err) => {
      logger.error(`[Email]: ${err.message}`);
    });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const login = (data) => {
  return handlerFactory.login({ Model: Employee, ...data });
};

const verifyEmail = async (data) => {
  const { email, token } = data;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const employee = await Employee.findOne({ email }).select(
    '+emailVerificationToken +emailVerificationTokenExpires',
  );

  if (!employee) throw new httpError.NotFound('Employee not found');

  if (employee.emailVerificationToken !== hashedToken) {
    throw new httpError.BadRequest('Invalid token');
  }

  if (new Date() > employee.emailVerificationTokenExpires) {
    throw new httpError.BadRequest('Token has expired');
  }

  employee.isEmailVerified = true;
  employee.emailVerificationToken = undefined;
  employee.emailVerificationTokenExpires = undefined;
  await employee.save();
};

const resendEmailVerificationToken = async (email) => {
  const employee = await Employee.findOne({ email });
  if (!employee) throw new httpError.NotFound('Employee not found');

  if (employee.isEmailVerified) throw new httpError.BadRequest('Email has already been verified');

  const token = employee.generateEmailVerificationToken();

  await employee.save();

  try {
    await sendEmailVerificationToken({ name: employee.firstName, email, token });
  } catch (err) {
    logger.error(`[ResendEmailVerificationToken]: ${err.message}`);

    employee.emailVerificationToken = undefined;
    employee.emailVerificationTokenExpires = undefined;
    await employee.save();

    throw err;
  }
};

const sendPasswordResetToken = (email) => {
  return handlerFactory.sendPasswordResetToken(Employee, email);
};

const resetPassword = (data) => {
  return handlerFactory.resetPassword({ Model: Employee, ...data });
};

const loginAdmin = (data) => {
  return handlerFactory.login({ Model: Admin, ...data });
};

const sendAdminPasswordResetToken = (email) => {
  return handlerFactory.sendPasswordResetToken(Admin, email);
};

const resetAdminPassword = (data) => {
  return handlerFactory.resetPassword({ Model: Admin, ...data });
};

const loginClient = (data) => {
  return handlerFactory.login({ Model: Client, ...data });
};

const sendClientPasswordResetToken = (email) => {
  return handlerFactory.sendPasswordResetToken(Client, email);
};

const resetClientPassword = (data) => {
  return handlerFactory.resetPassword({ Model: Client, ...data });
};

const loginAgency = (data) => {
  return handlerFactory.login({ Model: Agency, ...data });
};

const sendAgencyPasswordResetToken = (email) => {
  return handlerFactory.sendPasswordResetToken(Agency, email);
};

const resetAgencyPassword = (data) => {
  return handlerFactory.resetPassword({ Model: Agency, ...data });
};

const loginSubuser = (data) => {
  return handlerFactory.login({ Model: Subuser, ...data });
};

const sendSubuserPasswordResetToken = (email) => {
  return handlerFactory.sendPasswordResetToken(Subuser, email);
};

const resetSubuserPassword = (data) => {
  return handlerFactory.resetPassword({ Model: Subuser, ...data });
};

module.exports = {
  signUp,
  login,
  verifyEmail,
  resendEmailVerificationToken,
  sendPasswordResetToken,
  resetPassword,
  loginAdmin,
  sendAdminPasswordResetToken,
  resetAdminPassword,
  loginClient,
  sendClientPasswordResetToken,
  resetClientPassword,
  loginAgency,
  sendAgencyPasswordResetToken,
  resetAgencyPassword,
  loginSubuser,
  sendSubuserPasswordResetToken,
  resetSubuserPassword,
};
