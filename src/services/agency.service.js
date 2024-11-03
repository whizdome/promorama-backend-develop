const httpError = require('http-errors');

const Agency = require('../models/agency.model');
const Employee = require('../models/employee.model');
const Store = require('../models/store.model');

const { generatePassword } = require('../utils/random');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../utils/customLogger');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const { sendLoginCredentialsEmail } = require('../helpers/email');
const { EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');

const addAgency = async (data) => {
  const { name, email } = data;

  const password = generatePassword();
  const agency = new Agency({ ...data, password });
  await agency.save();

  try {
    await sendLoginCredentialsEmail({ name, email, password });
  } catch (err) {
    logger.error(`[AddAgency]: ${err.message}`);

    await Agency.deleteOne({ _id: agency._id });

    throw err;
  }
};

const getAgencies = async (reqQuery) => {
  const filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { email: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Agency.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const agencies = await apiFeatures.query;
  const totalCount = await Agency.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { agencies, totalCount };
};

const getAgenciesInExcel = async (reqQuery) => {
  const filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { email: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Agency.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const agencies = await apiFeatures.query.skip(skip).limit(limit);

  return agencies.map((agency) => ({
    Name: agency.name,
    Email: agency.email,
    'Phone Number': agency.phoneNumber,
    'Creation Date': agency.createdAt.toISOString().split('T')[0],
  }));
};

const getAgencyDetails = async (agencyId) => {
  const agency = await Agency.findById(agencyId);
  if (!agency) throw new httpError.NotFound('Agency not found');

  return agency;
};

const updateAgencyPassword = async (data) => {
  const { agencyId, currentPassword, newPassword } = data;

  const agency = await Agency.findById(agencyId).select('+password');
  if (!agency) throw new httpError.NotFound('Agency not found');

  const isValidPassword = await agency.verifyPassword(currentPassword);
  if (!isValidPassword) throw new httpError.BadRequest('Invalid password');

  agency.password = newPassword;
  return agency.save();
};

const updateAgencyDetails = async (data) => {
  const { agencyId, changes } = data;

  const agency = await Agency.findByIdAndUpdate(agencyId, changes, { new: true });
  if (!agency) throw new httpError.NotFound('Agency not found');

  return agency;
};

const deleteAgency = async (agencyId) => {
  const agency = await Agency.findByIdAndDelete(agencyId);
  if (!agency) throw new httpError.NotFound('Agency not found');

  return agency;
};

const softDeleteAgency = async (agencyId) => {
  const agency = await Agency.findByIdAndUpdate(
    agencyId,
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true },
  );

  if (!agency) throw new httpError.NotFound('Agency not found');

  return agency;
};

const restoreAgency = async (agencyId) => {
  const agency = await Agency.findByIdAndUpdate(
    agencyId,
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true },
  );

  if (!agency) throw new httpError.NotFound('Agency not found');

  return agency;
};

const addEmployee = async (data) => {
  const { agency, employeeId } = data;

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');
  if (employee.isDeleted) throw new httpError.BadRequest('Employee has been marked as deleted');

  await Agency.updateOne({ _id: agency.id }, { $addToSet: { employees: employeeId } });
};

// const getEmployees = async (agencyId) => {
//   const agency = await Agency.findById(agencyId).populate({
//     path: 'employees',
//     select: 'firstName lastName email phoneNumber profilePicture role',
//   });

//   if (!agency) throw new httpError.NotFound('Agency not found');

//   return agency.employees;
// };

const getEmployees = async (agency, reqQuery) => {
  const filter = { _id: { $in: agency.employees }, isDeleted: false };
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
  const { agency, employeeId } = data;

  await Agency.updateOne({ _id: agency.id }, { $pull: { employees: employeeId } });
};

const addStore = async (data) => {
  const { agency, storeId } = data;

  const store = await Store.findById(storeId);
  if (!store) throw new httpError.NotFound('Store not found');
  if (!store.isApproved) throw new httpError.BadRequest('Store not approved');
  if (store.isDeleted) throw new httpError.BadRequest('Store has been marked as deleted');

  await Agency.updateOne({ _id: agency.id }, { $addToSet: { stores: storeId } });
};

const getStores = async (agency, reqQuery) => {
  const filter = { _id: { $in: agency.stores }, isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { state: { $regex: sanitizedTerm, $options: 'i' } },
      { area: { $regex: sanitizedTerm, $options: 'i' } },
      { town: { $regex: sanitizedTerm, $options: 'i' } },
      { ownerFirstName: { $regex: sanitizedTerm, $options: 'i' } },
      { ownerLastName: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Store.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const stores = await apiFeatures.query;
  const totalCount = await Store.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { stores, totalCount };
};

const removeStore = async (data) => {
  const { agency, storeId } = data;

  await Agency.updateOne({ _id: agency.id }, { $pull: { stores: storeId } });
};

module.exports = {
  addAgency,
  getAgencies,
  getAgenciesInExcel,
  getAgencyDetails,
  updateAgencyPassword,
  updateAgencyDetails,
  deleteAgency,
  softDeleteAgency,
  restoreAgency,
  addEmployee,
  getEmployees,
  removeEmployee,
  addStore,
  getStores,
  removeStore,
};
