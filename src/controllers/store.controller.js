const httpError = require('http-errors');
const Joi = require('joi');

const storeService = require('../services/store.service');

const {
  validateStoreData,
  validateStoreUpdateData,
} = require('../helpers/validators/store.validators');
const { sendExcelFile } = require('../helpers/excel');

const addStore = async (req, res) => {
  const { error } = validateStoreData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const { store, message } = await storeService.addStore({
    currentUser: req.user,
    storeData: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message,
    data: store,
  });
};

const getAllStores = async (req, res) => {
  const { stores, totalCount } = await storeService.getAllStores(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Stores retrieved successfully',
    totalCount,
    data: stores,
  });
};

const getStoresInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
    clientId: Joi.string().min(24).max(24),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await storeService.getStoresInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'stores.xlsx' });
};

const getNearestStores = async (req, res) => {
  const { error } = Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    distInKM: Joi.number().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const stores = await storeService.getNearestStores(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Stores retrieved successfully',
    data: stores,
  });
};

const getStoreDetails = async (req, res) => {
  const store = await storeService.getStoreDetails(req.params.storeId);
  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Store details retrieved successfully',
    data: store,
  });
};

const updateStoreDetails = async (req, res) => {
  const { error } = validateStoreUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const store = await storeService.updateStoreDetails({
    currentUser: req.user,
    storeId: req.params.storeId,
    changes: req.body,
  });

  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Store updated successfully',
    data: store,
  });
};

const approveStore = async (req, res) => {
  const store = await storeService.approveStore(req.params.storeId);
  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Store approved successfully',
    data: store,
  });
};

const deleteStore = async (req, res) => {
  await storeService.deleteStore({
    storeId: req.params.storeId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Store deleted successfully',
  });
};

const softDeleteStore = async (req, res) => {
  const store = await storeService.softDeleteStore(req.params.storeId);
  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Store soft-deleted successfully',
  });
};

const restoreStore = async (req, res) => {
  const store = await storeService.restoreStore(req.params.storeId);
  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Store restored successfully',
  });
};

const addClient = async (req, res) => {
  const { error } = Joi.object({
    clientId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  const store = await storeService.addClient({
    storeId: req.params.storeId,
    ...req.body,
  });

  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Client added to the store successfully',
    data: store,
  });
};

const removeClient = async (req, res) => {
  const { error } = Joi.object({
    clientId: Joi.string().min(24).max(24).required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  const store = await storeService.removeClient({
    storeId: req.params.storeId,
    ...req.body,
  });

  if (!store) throw new httpError.NotFound('Store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Client removed from the store successfully',
    data: store,
  });
};

module.exports = {
  addStore,
  getAllStores,
  getStoresInExcel,
  getNearestStores,
  getStoreDetails,
  updateStoreDetails,
  approveStore,
  deleteStore,
  softDeleteStore,
  restoreStore,
  addClient,
  removeClient,
};
