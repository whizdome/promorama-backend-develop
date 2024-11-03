const httpError = require('http-errors');
const { startSession } = require('mongoose');

const Client = require('../models/client.model');
const Initiative = require('../models/initiative.model');
const InitiativeStore = require('../models/initiativeStore.model');
const Employee = require('../models/employee.model');
const Subuser = require('../models/subuser.model');

const { generatePassword } = require('../utils/random');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../utils/customLogger');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const { sendLoginCredentialsEmail } = require('../helpers/email');
const { ROLE, EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');

const addClient = async (data) => {
  const { currentUser, clientData } = data;
  const { companyName, email } = clientData;

  const password = generatePassword();
  const client = new Client({
    ...clientData,
    password,
    isApproved: currentUser.role === ROLE.SUPER_ADMIN,
  });
  await client.save();

  try {
    await sendLoginCredentialsEmail({ name: companyName, email, password });
  } catch (err) {
    logger.error(`[AddClient]: ${err.message}`);

    await Client.deleteOne({ _id: client._id });

    throw err;
  }
};

const getAllClients = async (reqQuery) => {
  let filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter = {
      isDeleted: false,
      $or: [
        { companyName: { $regex: sanitizedTerm, $options: 'i' } },
        { email: { $regex: sanitizedTerm, $options: 'i' } },
      ],
    };
  }

  const apiFeatures = new APIFeatures(Client.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const clients = await apiFeatures.query;
  const totalCount = await Client.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { clients, totalCount };
};

const getClientsInExcel = async (reqQuery) => {
  let filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter = {
      isDeleted: false,
      $or: [
        { companyName: { $regex: sanitizedTerm, $options: 'i' } },
        { email: { $regex: sanitizedTerm, $options: 'i' } },
      ],
    };
  }

  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Client.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const clients = await apiFeatures.query.skip(skip).limit(limit);

  return clients.map((client) => ({
    'Company Name': client.companyName,
    Email: client.email,
    'Phone Number': client.phoneNumber,
    'Creation Date': client.createdAt.toISOString().split('T')[0],
  }));
};

const getClientDetails = (clientId) => {
  return Client.findById(clientId);
};

const updateClientPassword = async (data) => {
  const { clientId, currentPassword, newPassword } = data;

  const client = await Client.findById(clientId).select('+password');
  if (!client) throw new httpError.NotFound('Client not found');

  const isValidPassword = await client.verifyPassword(currentPassword);
  if (!isValidPassword) throw new httpError.BadRequest('Invalid password');

  client.password = newPassword;
  return client.save();
};

const updateClientDetails = (data) => {
  const { clientId, changes } = data;

  return Client.findByIdAndUpdate(clientId, changes, { new: true });
};

const approveClient = (clientId) => {
  return Client.findByIdAndUpdate(clientId, { $set: { isApproved: true } }, { new: true });
};

const deleteClient = (clientId) => {
  return Client.findByIdAndDelete(clientId);
};

const softDeleteClient = async (clientId) => {
  const session = await startSession();
  try {
    session.startTransaction();

    const client = await Client.findByIdAndUpdate(
      clientId,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true, session },
    );

    if (!client) throw new httpError.NotFound('Client not found');

    const initiativeIDs = await Initiative.find({ client: client._id, isDeleted: false }).distinct(
      '_id',
    );

    if (initiativeIDs.length) {
      await InitiativeStore.updateMany(
        { initiative: { $in: initiativeIDs }, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), isBulkDeleted: true } },
        { session },
      );
    }

    await Initiative.updateMany(
      { client: client._id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), isBulkDeleted: true } },
      { session },
    );

    await Subuser.updateMany(
      { mainUser: client._id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), isBulkDeleted: true } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const restoreClient = async (clientId) => {
  const session = await startSession();
  try {
    session.startTransaction();

    const client = await Client.findByIdAndUpdate(
      clientId,
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true, session },
    );

    if (!client) throw new httpError.NotFound('Client not found');

    const initiativeIDs = await Initiative.find({
      client: client._id,
      isBulkDeleted: true,
    }).distinct('_id');

    if (initiativeIDs.length) {
      await InitiativeStore.updateMany(
        { initiative: { $in: initiativeIDs }, isBulkDeleted: true },
        { $set: { isDeleted: false, deletedAt: null, isBulkDeleted: false } },
        { session },
      );
    }

    await Initiative.updateMany(
      { client: client._id, isBulkDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, isBulkDeleted: false } },
      { session },
    );

    await Subuser.updateMany(
      { mainUser: client._id, isBulkDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, isBulkDeleted: false } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const addStatesFilterGroup = async (data) => {
  const { clientId, reqBody, currentUser } = data;

  if (currentUser.role === ROLE.CLIENT && currentUser.id !== clientId) {
    throw new httpError.Forbidden('Not allowed to create a states filter group for another client');
  }

  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  client.statesFilterGroups.push(reqBody);
  await client.save();
};

const updateStatesFilterGroup = async (data) => {
  const { clientId, groupId, changes, currentUser } = data;

  if (currentUser.role === ROLE.CLIENT && currentUser.id !== clientId) {
    throw new httpError.Forbidden('Not allowed to update a states filter group of another client');
  }

  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  const updatedClient = await Client.findOneAndUpdate(
    { _id: clientId, 'statesFilterGroups._id': groupId },
    {
      $set: {
        'statesFilterGroups.$.name': changes.name,
        'statesFilterGroups.$.states': changes.states,
      },
    },
    { new: true },
  );

  if (!updatedClient) throw new httpError.NotFound('States filter group not found');
};

const deleteStatesFilterGroup = async (data) => {
  const { clientId, groupId, currentUser } = data;

  if (currentUser.role === ROLE.CLIENT && currentUser.id !== clientId) {
    throw new httpError.Forbidden('Not allowed to delete a states filter group of another client');
  }

  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  const updatedClient = await Client.findOneAndUpdate(
    { _id: clientId, 'statesFilterGroups._id': groupId },
    {
      $pull: { statesFilterGroups: { _id: groupId } },
    },
    { new: true },
  );

  if (!updatedClient) throw new httpError.NotFound('States filter group not found');
};

const addEmployee = async (data) => {
  const { client, employeeId } = data;

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');
  if (employee.isDeleted) throw new httpError.BadRequest('Employee has been marked as deleted');

  await Client.updateOne({ _id: client.id }, { $addToSet: { employees: employeeId } });
};

const getEmployees = async (clientId, reqQuery) => {
  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  const filter = { _id: { $in: client.employees }, isDeleted: false };
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

  const employees = await apiFeatures.query;
  const totalCount = await Employee.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { employees, totalCount };
};

const removeEmployee = async (data) => {
  const { client, employeeId } = data;

  await Client.updateOne({ _id: client.id }, { $pull: { employees: employeeId } });
};

const updateShowOnStoreCreationStatus = async (clientId) => {
  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  client.showOnStoreCreation = !client.showOnStoreCreation;
  await client.save();

  return client;
};

module.exports = {
  addClient,
  getAllClients,
  getClientsInExcel,
  getClientDetails,
  updateClientPassword,
  updateClientDetails,
  approveClient,
  deleteClient,
  softDeleteClient,
  restoreClient,
  addStatesFilterGroup,
  updateStatesFilterGroup,
  deleteStatesFilterGroup,
  addEmployee,
  getEmployees,
  removeEmployee,
  updateShowOnStoreCreationStatus,
};
