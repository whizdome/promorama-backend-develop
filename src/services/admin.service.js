const httpError = require('http-errors');

const Admin = require('../models/admin.model');

const APIFeatures = require('../utils/apiFeatures');

const { ROLE, EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');

const createAdmin = (data) => {
  const { currentUser, adminData } = data;

  if (adminData.makeSuperAdmin && !currentUser.isDefaultAdmin) {
    throw new httpError.Forbidden('Only the default super admin can create another super admin');
  }

  adminData.role = adminData.makeSuperAdmin ? ROLE.SUPER_ADMIN : ROLE.ADMIN;

  return Admin.create(adminData);
};

const getAllAdmins = (reqQuery) => {
  const apiFeatures = new APIFeatures(Admin.find({}), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  return apiFeatures.query;
};

const getAdminsInExcel = async (reqQuery) => {
  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Admin.find({}), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const admins = await apiFeatures.query.skip(skip).limit(limit);

  return admins.map((admin) => ({
    'First Name': admin.firstName,
    'Last Name': admin.lastName,
    Email: admin.email,
    'Phone Number': admin.phoneNumber,
    Role: admin.role,
    Default: admin.isDefaultAdmin,
    'Creation Date': admin.createdAt.toISOString().split('T')[0],
  }));
};

const getAdminDetails = (adminId) => {
  return Admin.findById(adminId);
};

const updateAdminDetails = async (data) => {
  const { currentUser, adminId, changes } = data;

  const adminToBeUpdated = await Admin.findById(adminId);
  if (!adminToBeUpdated) throw new httpError.NotFound('Admin not found');

  if (adminToBeUpdated.isDefaultAdmin) {
    throw new httpError.Forbidden('Default admin details cannot be updated');
  }

  if (adminToBeUpdated.role === ROLE.SUPER_ADMIN && !currentUser.isDefaultAdmin) {
    throw new httpError.Forbidden('Only the default super admin can update a super admin details');
  }

  return Admin.updateOne({ _id: adminId }, changes, { new: true });
};

const updateAdminPassword = async (data) => {
  const { adminId, currentPassword, newPassword } = data;

  const admin = await Admin.findById(adminId).select('+password');
  if (!admin) throw new httpError.NotFound('Admin not found');

  const isValidPassword = await admin.verifyPassword(currentPassword);
  if (!isValidPassword) throw new httpError.BadRequest('Invalid password');

  admin.password = newPassword;
  return admin.save();
};

const changeAdminRole = async (data) => {
  const { currentUser, adminId } = data;

  if (!currentUser.isDefaultAdmin) {
    throw new httpError.Forbidden('Only the default super admin can change another admin role');
  }

  const adminToBeUpdated = await Admin.findById(adminId);
  if (!adminToBeUpdated) throw new httpError.NotFound('Admin not found');

  if (adminToBeUpdated.isDefaultAdmin) {
    throw new httpError.Forbidden('Default admin role cannot be changed');
  }

  adminToBeUpdated.role = adminToBeUpdated.role === ROLE.ADMIN ? ROLE.SUPER_ADMIN : ROLE.ADMIN;

  return adminToBeUpdated.save();
};

const deleteAdmin = async (data) => {
  const { currentUser, adminId } = data;

  const adminToBeDeleted = await Admin.findById(adminId);
  if (!adminToBeDeleted) throw new httpError.NotFound('Admin not found');

  if (adminToBeDeleted.role === ROLE.SUPER_ADMIN && !currentUser.isDefaultAdmin) {
    throw new httpError.Forbidden('Only the default super admin can delete another super admin');
  }

  if (adminToBeDeleted.isDefaultAdmin) {
    throw new httpError.Forbidden('Default admin cannot be deleted');
  }

  return adminToBeDeleted.deleteOne();
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminsInExcel,
  getAdminDetails,
  updateAdminDetails,
  updateAdminPassword,
  changeAdminRole,
  deleteAdmin,
};
