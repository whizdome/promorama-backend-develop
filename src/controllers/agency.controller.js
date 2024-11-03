const httpError = require('http-errors');
const Joi = require('joi');

const agencyService = require('../services/agency.service');

const {
  validateAgencyCreationData,
  validateAgencyUpdateData,
} = require('../helpers/validators/agency.validators');
const { validatePasswordUpdateData } = require('../helpers/validators/auth.validators');
const { sendExcelFile } = require('../helpers/excel');

const addAgency = async (req, res) => {
  const { error } = validateAgencyCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await agencyService.addAgency(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Agency added successfully',
  });
};

const getAgencies = async (req, res) => {
  const { agencies, totalCount } = await agencyService.getAgencies(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Agencies retrieved successfully',
    totalCount,
    data: agencies,
  });
};

const getAgenciesInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await agencyService.getAgenciesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'agencies.xlsx' });
};

const getAgencyDetails = async (req, res) => {
  const agency = await agencyService.getAgencyDetails(req.params.agencyId);

  return res.status(200).send({
    status: 'success',
    message: 'Agency details retrieved successfully',
    data: agency,
  });
};

const getAgencyProfile = async (req, res) => {
  return res.status(200).send({
    status: 'success',
    message: 'Agency profile retrieved successfully',
    data: req.user,
  });
};

const updateAgencyPassword = async (req, res) => {
  const { error } = validatePasswordUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await agencyService.updateAgencyPassword({ agencyId: req.user.id, ...req.body });

  res.status(200).send({
    status: 'success',
    message: 'Password updated successfully',
  });
};

const updateAgencyDetails = async (req, res) => {
  const { error } = validateAgencyUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await agencyService.updateAgencyDetails({
    agencyId: req.params.agencyId,
    changes: req.body,
  });

  res.status(200).send({
    status: 'success',
    message: 'Agency details updated successfully',
  });
};

const deleteAgency = async (req, res) => {
  await agencyService.deleteAgency(req.params.agencyId);

  return res.status(200).send({
    status: 'success',
    message: 'Agency deleted successfully',
  });
};

const softDeleteAgency = async (req, res) => {
  await agencyService.softDeleteAgency(req.params.agencyId);

  return res.status(200).send({
    status: 'success',
    message: 'Agency soft-deleted successfully',
  });
};

const restoreAgency = async (req, res) => {
  await agencyService.restoreAgency(req.params.agencyId);

  return res.status(200).send({
    status: 'success',
    message: 'Agency restored successfully',
  });
};

const addEmployee = async (req, res) => {
  const { error } = Joi.object({
    employeeId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await agencyService.addEmployee({ agency: req.user, employeeId: req.body.employeeId });

  return res.status(200).send({
    status: 'success',
    message: 'Employee added to the agency successfully',
  });
};

const getEmployees = async (req, res) => {
  const { employees, totalCount } = await agencyService.getEmployees(req.user, req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Employees retrieved successfully',
    totalCount,
    data: employees,
  });
};

const removeEmployee = async (req, res) => {
  await agencyService.removeEmployee({ agency: req.user, employeeId: req.params.employeeId });

  return res.status(200).send({
    status: 'success',
    message: 'Employee removed from the agency successfully',
  });
};

const addStore = async (req, res) => {
  const { error } = Joi.object({
    storeId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await agencyService.addStore({ agency: req.user, storeId: req.body.storeId });

  return res.status(200).send({
    status: 'success',
    message: 'Store added to the agency successfully',
  });
};

const getStores = async (req, res) => {
  const { stores, totalCount } = await agencyService.getStores(req.user, req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Stores retrieved successfully',
    totalCount,
    data: stores,
  });
};

const removeStore = async (req, res) => {
  await agencyService.removeStore({ agency: req.user, storeId: req.params.storeId });

  return res.status(200).send({
    status: 'success',
    message: 'Store removed from the agency successfully',
  });
};

module.exports = {
  addAgency,
  getAgencies,
  getAgenciesInExcel,
  getAgencyDetails,
  getAgencyProfile,
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
