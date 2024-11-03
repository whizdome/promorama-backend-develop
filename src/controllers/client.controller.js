const httpError = require('http-errors');
const Joi = require('joi');

const clientService = require('../services/client.service');

const {
  validateClientCreationData,
  validateClientUpdateData,
  validateStatesFilterGroupData,
} = require('../helpers/validators/client.validators');
const { validatePasswordUpdateData } = require('../helpers/validators/auth.validators');
const { sendExcelFile } = require('../helpers/excel');

const addClient = async (req, res) => {
  const { error } = validateClientCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await clientService.addClient({ currentUser: req.user, clientData: req.body });

  return res.status(201).send({
    status: 'success',
    message: 'Client added successfully',
  });
};

const getAllClients = async (req, res) => {
  const { clients, totalCount } = await clientService.getAllClients(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Clients retrieved successfully',
    totalCount,
    data: clients,
  });
};

const getClientsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await clientService.getClientsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'clients.xlsx' });
};

const getClientDetails = async (req, res) => {
  const client = await clientService.getClientDetails(req.params.clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  return res.status(200).send({
    status: 'success',
    message: 'Client details retrieved successfully',
    data: client,
  });
};

const getClientProfile = async (req, res) => {
  return res.status(200).send({
    status: 'success',
    message: 'Client profile retrieved successfully',
    data: req.user,
  });
};

const updateClientPassword = async (req, res) => {
  const { error } = validatePasswordUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await clientService.updateClientPassword({ clientId: req.user.id, ...req.body });

  res.status(200).send({
    status: 'success',
    message: 'Password updated successfully',
  });
};

const updateClientDetails = async (req, res) => {
  const { error } = validateClientUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const client = await clientService.updateClientDetails({
    clientId: req.params.clientId,
    changes: req.body,
  });

  if (!client) throw new httpError.NotFound('Client not found');

  res.status(200).send({
    status: 'success',
    message: 'Client details updated successfully',
  });
};

const approveClient = async (req, res) => {
  const client = await clientService.approveClient(req.params.clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  return res.status(200).send({
    status: 'success',
    message: 'Client approved successfully',
    data: client,
  });
};

const deleteClient = async (req, res) => {
  const client = await clientService.deleteClient(req.params.clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  return res.status(200).send({
    status: 'success',
    message: 'Client deleted successfully',
  });
};

const softDeleteClient = async (req, res) => {
  await clientService.softDeleteClient(req.params.clientId);

  return res.status(200).send({
    status: 'success',
    message: 'Client soft-deleted successfully',
  });
};

const restoreClient = async (req, res) => {
  await clientService.restoreClient(req.params.clientId);

  return res.status(200).send({
    status: 'success',
    message: 'Client restored successfully',
  });
};

const addStatesFilterGroup = async (req, res) => {
  const { error } = validateStatesFilterGroupData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await clientService.addStatesFilterGroup({
    clientId: req.params.clientId,
    reqBody: req.body,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'States filter group added successfully',
  });
};

const updateStatesFilterGroup = async (req, res) => {
  const { error } = validateStatesFilterGroupData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await clientService.updateStatesFilterGroup({
    clientId: req.params.clientId,
    groupId: req.params.groupId,
    changes: req.body,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'States filter group updated successfully',
  });
};

const deleteStatesFilterGroup = async (req, res) => {
  await clientService.deleteStatesFilterGroup({
    clientId: req.params.clientId,
    groupId: req.params.groupId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'States filter group deleted successfully',
  });
};

const addEmployee = async (req, res) => {
  const { error } = Joi.object({
    employeeId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await clientService.addEmployee({ client: req.user, employeeId: req.body.employeeId });

  return res.status(200).send({
    status: 'success',
    message: 'Employee added to the client successfully',
  });
};

const getEmployees = async (req, res) => {
  const { employees, totalCount } = await clientService.getEmployees(
    req.params.clientId,
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Employees retrieved successfully',
    totalCount,
    data: employees,
  });
};

const removeEmployee = async (req, res) => {
  await clientService.removeEmployee({ client: req.user, employeeId: req.params.employeeId });

  return res.status(200).send({
    status: 'success',
    message: 'Employee removed from the client successfully',
  });
};

const updateShowOnStoreCreationStatus = async (req, res) => {
  await clientService.updateShowOnStoreCreationStatus(req.params.clientId);

  return res.status(200).send({
    status: 'success',
    message: 'Status updated successfully',
  });
};

module.exports = {
  addClient,
  getAllClients,
  getClientsInExcel,
  getClientDetails,
  getClientProfile,
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
