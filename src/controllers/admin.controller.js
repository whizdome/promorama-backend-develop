const httpError = require('http-errors');
const Joi = require('joi');

const adminService = require('../services/admin.service');

const {
  validateAdminCreationData,
  validateAdminUpdatesData,
} = require('../helpers/validators/admin.validators');
const { validatePasswordUpdateData } = require('../helpers/validators/auth.validators');
const { sendExcelFile } = require('../helpers/excel');

const createAdmin = async (req, res) => {
  const { error } = validateAdminCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await adminService.createAdmin({ currentUser: req.user, adminData: req.body });

  return res.status(201).send({
    status: 'success',
    message: 'Admin created successfully',
  });
};

const getAllAdmins = async (req, res) => {
  const admins = await adminService.getAllAdmins(req.query);

  res.status(200).send({
    status: 'success',
    message: 'Admins retrieved successfully',
    data: admins,
  });
};

const getAdminsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await adminService.getAdminsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'admins.xlsx' });
};

const getAdminDetails = async (req, res) => {
  const admin = await adminService.getAdminDetails(req.params.adminId);

  if (!admin) throw new httpError.NotFound('Admin not found');

  res.status(200).send({
    status: 'success',
    message: 'Admin details retrieved successfully',
    data: admin,
  });
};

const getProfileDetails = async (req, res) => {
  res.status(200).send({
    status: 'success',
    message: 'Profile details retrieved successfully',
    data: req.user,
  });
};

const updateAdminDetails = async (req, res) => {
  const { error } = validateAdminUpdatesData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await adminService.updateAdminDetails({
    currentUser: req.user,
    adminId: req.params.adminId,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Admin details updated successfully',
  });
};

const updateAdminPassword = async (req, res) => {
  const { error } = validatePasswordUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await adminService.updateAdminPassword({ adminId: req.user.id, ...req.body });

  res.status(200).send({
    status: 'success',
    message: 'Password updated successfully',
  });
};

const changeAdminRole = async (req, res) => {
  await adminService.changeAdminRole({
    currentUser: req.user,
    adminId: req.params.adminId,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Admin role updated successfully',
  });
};

const deleteAdmin = async (req, res) => {
  const admin = await adminService.deleteAdmin({
    currentUser: req.user,
    adminId: req.params.adminId,
  });

  if (!admin) throw new httpError.NotFound('Admin not found');

  res.status(204).send({
    status: 'success',
    message: 'Admin deleted successfully',
  });
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminsInExcel,
  getAdminDetails,
  getProfileDetails,
  updateAdminDetails,
  updateAdminPassword,
  changeAdminRole,
  deleteAdmin,
};
