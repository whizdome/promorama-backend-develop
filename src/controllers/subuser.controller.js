const httpError = require('http-errors');
const Joi = require('joi');

const subuserService = require('../services/subuser.service');

const {
  validateSubuserCreationData,
  validateSubuserUpdateData,
} = require('../helpers/validators/subuser.validators');
const { validatePasswordUpdateData } = require('../helpers/validators/auth.validators');
const { sendExcelFile } = require('../helpers/excel');

const addSubuser = async (req, res) => {
  const { error } = validateSubuserCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await subuserService.addSubuser(req.user, req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Subuser added successfully',
  });
};

const getSubusers = async (req, res) => {
  const { subusers, totalCount } = await subuserService.getSubusers(req.user, req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Subusers retrieved successfully',
    totalCount,
    data: subusers,
  });
};

const getSubusersInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await subuserService.getSubusersInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'subusers.xlsx' });
};

const getSubuserDetails = async (req, res) => {
  const subuser = await subuserService.getSubuserDetails(req.params.subuserId);

  return res.status(200).send({
    status: 'success',
    message: 'Subuser details retrieved successfully',
    data: subuser,
  });
};

const getSubuserProfile = async (req, res) => {
  return res.status(200).send({
    status: 'success',
    message: 'Subuser profile retrieved successfully',
    data: req.user,
  });
};

const updateSubuserPassword = async (req, res) => {
  const { error } = validatePasswordUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await subuserService.updateSubuserPassword({ subuserId: req.user.id, ...req.body });

  res.status(200).send({
    status: 'success',
    message: 'Password updated successfully',
  });
};

const updateSubuserDetails = async (req, res) => {
  const { error } = validateSubuserUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await subuserService.updateSubuserDetails({
    currentUser: req.user,
    subuserId: req.params.subuserId,
    changes: req.body,
  });

  res.status(200).send({
    status: 'success',
    message: 'Subuser details updated successfully',
  });
};

const deleteSubuser = async (req, res) => {
  await subuserService.deleteSubuser(req.user, req.params.subuserId);

  return res.status(200).send({
    status: 'success',
    message: 'Subuser deleted successfully',
  });
};

const softDeleteSubuser = async (req, res) => {
  await subuserService.softDeleteSubuser(req.user, req.params.subuserId);

  return res.status(200).send({
    status: 'success',
    message: 'Subuser soft-deleted successfully',
  });
};

const restoreSubuser = async (req, res) => {
  await subuserService.restoreSubuser(req.user, req.params.subuserId);

  return res.status(200).send({
    status: 'success',
    message: 'Subuser restored successfully',
  });
};

const assignInitiative = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await subuserService.assignInitiative({
    currentUser: req.user,
    subuserId: req.params.subuserId,
    ...req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative assigned to the subuser successfully',
  });
};

const getAssignedInitiatives = async (req, res) => {
  const { initiatives, totalCount } = await subuserService.getAssignedInitiatives(
    req.user,
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Initiatives retrieved successfully',
    totalCount,
    data: initiatives,
  });
};

const unassignInitiative = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await subuserService.unassignInitiative({
    currentUser: req.user,
    subuserId: req.params.subuserId,
    ...req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative unassigned from the subuser successfully',
  });
};

module.exports = {
  addSubuser,
  getSubusers,
  getSubusersInExcel,
  getSubuserDetails,
  getSubuserProfile,
  updateSubuserPassword,
  updateSubuserDetails,
  deleteSubuser,
  softDeleteSubuser,
  restoreSubuser,
  assignInitiative,
  getAssignedInitiatives,
  unassignInitiative,
};
