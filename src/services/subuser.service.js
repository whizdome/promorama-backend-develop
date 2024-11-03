const httpError = require('http-errors');

const Subuser = require('../models/subuser.model');
const Initiative = require('../models/initiative.model');

const { generatePassword } = require('../utils/random');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../utils/customLogger');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const { sendLoginCredentialsEmail } = require('../helpers/email');
const { EXCEL_MAX_DOWNLOAD_RANGE, ROLE_TO_MODEL_MAPPING, ROLE } = require('../helpers/constants');

const addSubuser = async (currentUser, subuserData) => {
  const { name, email } = subuserData;

  const password = generatePassword();
  const subuser = new Subuser({
    ...subuserData,
    password,
    mainUser: currentUser.id,
    mainUserModel: ROLE_TO_MODEL_MAPPING[currentUser.role],
  });
  await subuser.save();

  try {
    await sendLoginCredentialsEmail({ name, email, password });
  } catch (err) {
    logger.error(`[AddSubuser]: ${err.message}`);

    await Subuser.deleteOne({ _id: subuser._id });

    throw err;
  }
};

const getSubusers = async (currentUser, reqQuery) => {
  const filter = { isDeleted: false };
  if (currentUser.role === ROLE.CLIENT) filter.mainUser = currentUser.id;

  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { email: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Subuser.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const subusers = await apiFeatures.query;
  const totalCount = await Subuser.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { subusers, totalCount };
};

const getSubusersInExcel = async (reqQuery) => {
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

  const apiFeatures = new APIFeatures(Subuser.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const subusers = await apiFeatures.query.skip(skip).limit(limit);

  return subusers.map((subuser) => ({
    Name: subuser.name,
    Email: subuser.email,
    'Creation Date': subuser.createdAt.toISOString().split('T')[0],
  }));
};

const getSubuserDetails = async (subuserId) => {
  const subuser = await Subuser.findById(subuserId).populate({
    path: 'initiatives',
    select: 'name description imageURL',
  });
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  return subuser;
};

const updateSubuserPassword = async (data) => {
  const { subuserId, currentPassword, newPassword } = data;

  const subuser = await Subuser.findById(subuserId).select('+password');
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  const isValidPassword = await subuser.verifyPassword(currentPassword);
  if (!isValidPassword) throw new httpError.BadRequest('Invalid password');

  subuser.password = newPassword;
  return subuser.save();
};

const updateSubuserDetails = async (data) => {
  const { currentUser, subuserId, changes } = data;

  const subuser = await Subuser.findById(subuserId);
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  if (subuser.mainUser.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this subuser');
  }

  await Subuser.updateOne({ _id: subuserId }, changes);
};

const deleteSubuser = async (currentUser, subuserId) => {
  const subuser = await Subuser.findById(subuserId);
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && subuser.mainUser.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this subuser');
  }

  await Subuser.deleteOne({ _id: subuserId });
};

const softDeleteSubuser = async (currentUser, subuserId) => {
  const subuser = await Subuser.findById(subuserId);
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && subuser.mainUser.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this subuser');
  }

  subuser.isDeleted = true;
  subuser.deletedAt = new Date();

  await subuser.save();
};

const restoreSubuser = async (currentUser, subuserId) => {
  const subuser = await Subuser.findById(subuserId);
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && subuser.mainUser.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to restore this subuser');
  }

  subuser.isDeleted = false;
  subuser.deletedAt = null;

  await subuser.save();
};

const assignInitiative = async (data) => {
  const { currentUser, subuserId, initiativeId } = data;

  const subuser = await Subuser.findById(subuserId);
  if (!subuser) throw new httpError.NotFound('Subuser not found');
  if (subuser.isDeleted) throw new httpError.BadRequest('Subuser has been marked as deleted');

  if (subuser.mainUser.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to assign an initiative to this subuser');
  }

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');
  if (initiative.isDeleted) throw new httpError.BadRequest('Initiative has been marked as deleted');

  if (initiative.client.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to assign this initiative to a subuser');
  }

  await Subuser.updateOne({ _id: subuserId }, { $addToSet: { initiatives: initiativeId } });
};

const getAssignedInitiatives = async (subuser, reqQuery) => {
  const filter = { _id: { $in: subuser.initiatives }, isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { description: { $regex: sanitizedTerm, $options: 'i' } },
      { instructions: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Initiative.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'client',
      select: 'companyName email phoneNumber profilePicture statesFilterGroups',
    })
    .populate({
      path: 'agency',
      select: 'name email phoneNumber profilePicture',
    });

  const initiatives = await apiFeatures.query;
  const totalCount = await Initiative.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { initiatives, totalCount };
};

const unassignInitiative = async (data) => {
  const { currentUser, subuserId, initiativeId } = data;

  const subuser = await Subuser.findById(subuserId);
  if (!subuser) throw new httpError.NotFound('Subuser not found');

  if (subuser.mainUser.toString() !== currentUser.id) {
    throw new httpError.Forbidden(
      'You are not allowed to unassign an initiative from this subuser',
    );
  }

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');
  if (initiative.isDeleted) throw new httpError.BadRequest('Initiative has been marked as deleted');

  if (initiative.client.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to unassign this initiative from a subuser');
  }

  await Subuser.updateOne({ _id: subuserId }, { $pull: { initiatives: initiativeId } });
};

module.exports = {
  addSubuser,
  getSubusers,
  getSubusersInExcel,
  getSubuserDetails,
  updateSubuserPassword,
  updateSubuserDetails,
  deleteSubuser,
  softDeleteSubuser,
  restoreSubuser,
  assignInitiative,
  getAssignedInitiatives,
  unassignInitiative,
};
