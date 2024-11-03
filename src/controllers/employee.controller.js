const httpError = require('http-errors');
const Joi = require('joi');

const employeeService = require('../services/employee.service');

const {
  validateEmployeeCreationData,
  validateInviteData,
  validateEmployeeUpdateData,
} = require('../helpers/validators/employee.validators');
const { validatePasswordUpdateData } = require('../helpers/validators/auth.validators');
const { sendExcelFile } = require('../helpers/excel');

const addEmployee = async (req, res) => {
  const { error } = validateEmployeeCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await employeeService.addEmployee(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Employee added successfully',
  });
};

const getAllEmployees = async (req, res) => {
  const { employees, totalCount } = await employeeService.getAllEmployees(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Employees retrieved successfully',
    totalCount,
    data: employees,
  });
};

const getEmployeesInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
    clientId: Joi.string().min(24).max(24),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await employeeService.getEmployeesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'employees.xlsx' });
};

const getEmployeeDetails = async (req, res) => {
  const employee = await employeeService.getEmployeeDetails(req.params.employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');

  return res.status(200).send({
    status: 'success',
    message: 'Employee details retrieved successfully',
    data: employee,
  });
};

const getEmployeeProfile = async (req, res) => {
  return res.status(200).send({
    status: 'success',
    message: 'Employee profile retrieved successfully',
    data: req.user,
  });
};

const updateEmployeePassword = async (req, res) => {
  const { error } = validatePasswordUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await employeeService.updateEmployeePassword({ employeeId: req.user.id, ...req.body });

  res.status(200).send({
    status: 'success',
    message: 'Password updated successfully',
  });
};

const updateEmployeeDetails = async (req, res) => {
  const { error } = validateEmployeeUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await employeeService.updateEmployeeDetails({
    currentUser: req.user,
    employeeId: req.params.employeeId,
    changes: req.body,
  });

  res.status(200).send({
    status: 'success',
    message: 'Employee details updated successfully',
  });
};

const deleteEmployee = async (req, res) => {
  await employeeService.deleteEmployee({
    employeeId: req.params.employeeId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Employee deleted successfully',
  });
};

const softDeleteEmployee = async (req, res) => {
  await employeeService.softDeleteEmployee({
    employeeId: req.params.employeeId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Employee soft-deleted successfully',
  });
};

const restoreEmployee = async (req, res) => {
  const employee = await employeeService.restoreEmployee(req.params.employeeId);
  if (!employee) throw new httpError.NotFound('Employee not found');

  return res.status(200).send({
    status: 'success',
    message: 'Employee restored successfully',
  });
};

const requestDeviceChange = async (req, res) => {
  const { reason } = req.body;
  const { deviceId, isDeviceChangeRequested } = req.user;

  if (!reason || typeof reason !== 'string') {
    throw new httpError.BadRequest('"reason" is required and must be a string');
  }

  if (!deviceId) {
    throw new httpError.BadRequest(
      'No device is currently linked to your account. Kindly proceed to link your device',
    );
  }

  if (isDeviceChangeRequested) {
    throw new httpError.BadRequest('Your request to change your device has already been sent');
  }

  await employeeService.requestDeviceChange({ currentUser: req.user, reason });

  return res.status(200).send({
    status: 'success',
    message: 'Request for device change sent successfully',
  });
};

const enableDeviceChange = async (req, res) => {
  await employeeService.enableDeviceChange(req.params.employeeId);

  return res.status(200).send({
    status: 'success',
    message: 'Employee device change enabled successfully',
  });
};

const linkDevice = async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId || typeof deviceId !== 'string') {
    throw new httpError.BadRequest('"deviceId" is required and must be a string');
  }

  if (req.user.deviceId) {
    throw new httpError.BadRequest(
      'A device has already been linked to this account. Please request a device change to link a new device',
    );
  }

  await employeeService.linkDevice({ currentUser: req.user, deviceId });

  return res.status(200).send({
    status: 'success',
    message: 'Device linked successfully',
  });
};

const sendInvite = async (req, res) => {
  const { error } = validateInviteData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await employeeService.sendInvite({ currentUser: req.user, inviteData: req.body });

  return res.status(200).send({
    status: 'success',
    message: 'Invite sent successfully',
  });
};

const assignTeamMembers = async (req, res) => {
  const { error } = Joi.object({
    userIDs: Joi.array().items(Joi.string().min(24).max(24)).min(1).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await employeeService.assignTeamMembers({
    employeeId: req.params.employeeId,
    userIDs: req.body.userIDs,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Team members assigned to the employee successfully',
  });
};

const getTeamMembers = async (req, res) => {
  const { teamMembers, totalCount } = await employeeService.getTeamMembers(
    req.params.employeeId,
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Team members retrieved successfully',
    totalCount,
    data: teamMembers,
  });
};

const unassignTeamMembers = async (req, res) => {
  const { error } = Joi.object({
    userIDs: Joi.array().items(Joi.string().min(24).max(24)).min(1).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await employeeService.unassignTeamMembers({
    employeeId: req.params.employeeId,
    userIDs: req.body.userIDs,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Team members unassigned from the employee successfully',
  });
};

module.exports = {
  addEmployee,
  getAllEmployees,
  getEmployeesInExcel,
  getEmployeeDetails,
  getEmployeeProfile,
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
