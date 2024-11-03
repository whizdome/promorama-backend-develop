const httpError = require('http-errors');
const uuid = require('uuid');

const Employee = require('../models/employee.model');
const InAppNotification = require('../models/inAppNotification.model');
const PushNotification = require('../models/pushNotification.model');
const Invite = require('../models/invite.model');
const Client = require('../models/client.model');

const { generatePassword } = require('../utils/random');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../utils/customLogger');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const { sendPushNotification } = require('../utils/pushNotification');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const {
  sendLoginCredentialsEmail,
  // sendDeviceChangeRequestEmail,
  sendDeviceChangeEnabledEmail,
  sendSignUpInviteEmail,
} = require('../helpers/email');
const socketIO = require('../helpers/socketIO');
const { ROLE, EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');

const addEmployee = async (data) => {
  const { firstName, email } = data;

  const password = generatePassword();
  const employee = new Employee({ ...data, password });
  await employee.save();

  try {
    await sendLoginCredentialsEmail({ name: firstName, email, password });
  } catch (err) {
    logger.error(`[AddEmployee]: ${err.message}`);

    await Employee.deleteOne({ _id: employee._id });

    throw err;
  }
};

const getAllEmployees = async (reqQuery) => {
  let filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter = {
      isDeleted: false,
      $or: [
        { firstName: { $regex: sanitizedTerm, $options: 'i' } },
        { lastName: { $regex: sanitizedTerm, $options: 'i' } },
        { email: { $regex: sanitizedTerm, $options: 'i' } },
      ],
    };
  }

  const apiFeatures = new APIFeatures(Employee.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const employees = await apiFeatures.query;
  const totalCount = await Employee.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { employees, totalCount };
};

const getEmployeesInExcel = async (reqQuery) => {
  let filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter = {
      isDeleted: false,
      $or: [
        { firstName: { $regex: sanitizedTerm, $options: 'i' } },
        { lastName: { $regex: sanitizedTerm, $options: 'i' } },
        { email: { $regex: sanitizedTerm, $options: 'i' } },
      ],
    };
  }

  const { startRange, endRange, clientId, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  if (clientId) {
    const client = await Client.findById(clientId);
    if (!client) throw new httpError.NotFound('Client not found');
    filter._id = { $in: client.employees };
  }

  const apiFeatures = new APIFeatures(Employee.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const employees = await apiFeatures.query.skip(skip).limit(limit);

  return employees.map((employee) => ({
    'First Name': employee.firstName,
    'Last Name': employee.lastName,
    Email: employee.email,
    'Phone Number': employee.phoneNumber,
    Role: employee.role,
    'Creation Date': employee.createdAt.toISOString().split('T')[0],
  }));
};

const getEmployeeDetails = (employeeId) => {
  return Employee.findById(employeeId);
};

const updateEmployeePassword = async (data) => {
  const { employeeId, currentPassword, newPassword } = data;

  const employee = await Employee.findById(employeeId).select('+password');
  if (!employee) throw new httpError.NotFound('Employee not found');

  const isValidPassword = await employee.verifyPassword(currentPassword);
  if (!isValidPassword) throw new httpError.BadRequest('Invalid password');

  employee.password = newPassword;
  return employee.save();
};

const updateEmployeeDetails = async (data) => {
  const { currentUser, employeeId, changes } = data;

  let allowedChanges = {};

  if (
    (currentUser.role === ROLE.PROMOTER || currentUser.role === ROLE.SUPERVISOR) &&
    currentUser.id !== employeeId
  ) {
    throw new httpError.Forbidden("You are not allowed to update this employee's profile");
  }

  if (currentUser.role === ROLE.PROMOTER || currentUser.role === ROLE.SUPERVISOR) {
    if (changes.address) allowedChanges.address = changes.address;
    if (changes.profilePicture) allowedChanges.profilePicture = changes.profilePicture;
  } else {
    allowedChanges = changes;
  }

  const employee = await Employee.findByIdAndUpdate(employeeId, allowedChanges, { new: true });
  if (!employee) throw new httpError.NotFound('Employee not found');

  return employee;
};

const deleteEmployee = async (data) => {
  const { employeeId, currentUser } = data;

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');

  if (
    currentUser.role !== ROLE.SUPER_ADMIN &&
    currentUser.role !== ROLE.ADMIN &&
    currentUser.id !== employeeId
  ) {
    throw new httpError.Forbidden('You are not allowed to delete this employee');
  }

  return Employee.deleteOne({ _id: employeeId });
};

const softDeleteEmployee = async (data) => {
  const { employeeId, currentUser } = data;

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');

  if (
    currentUser.role !== ROLE.SUPER_ADMIN &&
    currentUser.role !== ROLE.ADMIN &&
    currentUser.id !== employeeId
  ) {
    throw new httpError.Forbidden('You are not allowed to delete this employee');
  }

  employee.isDeleted = true;
  employee.deletedAt = new Date();
  return employee.save();
};

const restoreEmployee = (employeeId) => {
  return Employee.findByIdAndUpdate(
    employeeId,
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true },
  );
};

const requestDeviceChange = async (data) => {
  const { currentUser, reason } = data;

  currentUser.isDeviceChangeRequested = true;
  currentUser.deviceChangeRequestReason = reason;
  currentUser.deviceChangeRequestsCount += 1;
  await currentUser.save();

  // sendDeviceChangeRequestEmail({
  //   employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
  //   employeeEmail: currentUser.email,
  //   reason,
  // });

  // InAppNotification.insertNotification({
  //   userId: 'admin',
  //   entityId: currentUser.id,
  //   type: 'Device',
  //   description: `An employee has requested to link a new device`,
  // });
  // socketIO.io.emit('newNotification');
};

const enableDeviceChange = async (employeeId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');

  if (!employee.isDeviceChangeRequested) {
    throw new httpError.BadRequest('This employee does not request for a device change');
  }

  employee.isDeviceChangeRequested = false;
  employee.deviceChangeRequestReason = null;
  employee.deviceId = null;
  await employee.save();

  sendDeviceChangeEnabledEmail({ name: employee.firstName, email: employee.email });

  const text = `Your request to link a new device has been granted`;
  const tokens = await PushNotification.getUserDeviceTokens(employeeId);
  if (tokens.length) sendPushNotification({ title: 'Device Change Granted', body: text, tokens });

  InAppNotification.insertNotification({
    userId: employeeId,
    entityId: employeeId,
    type: 'Device',
    description: text,
  });
  socketIO.io.to(employee.socketId).emit('newNotification', text);
};

const linkDevice = async (data) => {
  const { currentUser, deviceId } = data;

  await Employee.findOneAndUpdate(
    { _id: { $ne: currentUser.id }, deviceId, role: currentUser.role },
    { $set: { deviceId: null } },
  );

  currentUser.deviceId = deviceId;

  return currentUser.save();
};

const sendInvite = async (data) => {
  const { currentUser, inviteData } = data;
  const { role, emails } = inviteData;

  const inviteId = uuid.v4();

  await Invite.create({ inviteId, role, emails });

  const sendEmailPromises = emails.map((email) =>
    sendSignUpInviteEmail({ email, role, inviteId, currentUser }),
  );

  return Promise.allSettled(sendEmailPromises).catch((err) =>
    logger.error(`[SendInvite]: ${err.message}`),
  );
};

const assignTeamMembers = async (data) => {
  const { employeeId, userIDs } = data;

  const verifiedUserIDs = await Employee.find({ _id: { $ne: employeeId, $in: userIDs } }).distinct(
    '_id',
  );

  const employee = await Employee.findByIdAndUpdate(employeeId, {
    $addToSet: { teamMembers: { $each: verifiedUserIDs } },
  });

  if (!employee) throw new httpError.NotFound('Employee not found');
};

const getTeamMembers = async (employeeId, reqQuery) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');

  const filter = { _id: { $in: employee.teamMembers }, isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { firstName: { $regex: sanitizedTerm, $options: 'i' } },
      { lastName: { $regex: sanitizedTerm, $options: 'i' } },
      { email: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Employee.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const teamMembers = await apiFeatures.query;
  const totalCount = await Employee.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { teamMembers, totalCount };
};

const unassignTeamMembers = async (data) => {
  const { employeeId, userIDs } = data;

  await Employee.updateOne({ _id: employeeId }, { $pullAll: { teamMembers: userIDs } });
};

module.exports = {
  addEmployee,
  getAllEmployees,
  getEmployeesInExcel,
  getEmployeeDetails,
  updateEmployeePassword,
  updateEmployeeDetails,
  deleteEmployee,
  softDeleteEmployee,
  restoreEmployee,
  requestDeviceChange,
  enableDeviceChange,
  linkDevice,
  sendInvite,
  assignTeamMembers,
  getTeamMembers,
  unassignTeamMembers,
};
