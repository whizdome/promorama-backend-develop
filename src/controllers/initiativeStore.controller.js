const httpError = require('http-errors');
const Joi = require('joi');

const initiativeStoreService = require('../services/initiativeStore.service');

const {
  validateInitiativeStoreCreationData,
  validateInitiativeStoreUpdatesData,
  validateGamePrizeData,
} = require('../helpers/validators/initiative.validators');
const { sendExcelFile } = require('../helpers/excel');

const createInitiativeStore = async (req, res) => {
  const { error } = validateInitiativeStoreCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoreService.createInitiativeStore({
    initiativeId: req.params.initiativeId,
    currentUser: req.user,
    ...req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Initiative store created successfully',
  });
};

const getInitiativeStores = async (req, res) => {
  const { initiativeStores, totalCount } = await initiativeStoreService.getInitiativeStores(
    req.params.initiativeId,
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores retrieved successfully',
    totalCount,
    data: initiativeStores,
  });
};

const getInitiativeStoresInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await initiativeStoreService.getInitiativeStoresInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'initiative_stores.xlsx' });
};

const getAssignedInitiativeStores = async (req, res) => {
  const initiativeStores = await initiativeStoreService.getAssignedInitiativeStores(
    req.user,
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores retrieved successfully',
    data: initiativeStores,
  });
};

const getInitiativeStoreDetails = async (req, res) => {
  const initiativeStore = await initiativeStoreService.getInitiativeStoreDetails(
    req.params.initiativeStoreId,
  );

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Initiative store details retrieved successfully',
    data: initiativeStore,
  });
};

const getInitiativeStoresWithNoSubmission = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    date: Joi.date().iso().required(),
    resourceType: Joi.string()
      .valid(
        'attendance',
        'competitor',
        'inventory',
        'order',
        'payment',
        'priceCheck',
        'sale',
        'shelfAndPosm',
        'shipment',
        'msl',
        'sos',
      )
      .required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const { initiativeStores, totalCount } =
    await initiativeStoreService.getInitiativeStoresWithNoSubmission(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores retrieved successfully',
    totalCount,
    data: initiativeStores,
  });
};

const getInitiativeStoresWithNoSubmissionInExcel = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    date: Joi.date().iso().required(),
    resourceType: Joi.string()
      .valid(
        'attendance',
        'competitor',
        'inventory',
        'order',
        'payment',
        'priceCheck',
        'sale',
        'shelfAndPosm',
        'shipment',
        'msl',
        'sos',
      )
      .required(),
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await initiativeStoreService.getInitiativeStoresWithNoSubmissionInExcel(
    req.query,
  );

  sendExcelFile(res, excelData, { fileName: 'initiative_stores_wns.xlsx' });
};

const updateInitiativeStore = async (req, res) => {
  const { error } = validateInitiativeStoreUpdatesData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoreService.updateInitiativeStore({
    initiativeStoreId: req.params.initiativeStoreId,
    ...req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative store updated successfully',
  });
};

const deleteInitiativeStore = async (req, res) => {
  await initiativeStoreService.deleteInitiativeStore({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative store deleted successfully',
  });
};

const softDeleteInitiativeStore = async (req, res) => {
  const initiativeStore = await initiativeStoreService.softDeleteInitiativeStore(
    req.params.initiativeStoreId,
  );

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Initiative store soft-deleted successfully',
  });
};

const restoreInitiativeStore = async (req, res) => {
  const initiativeStore = await initiativeStoreService.restoreInitiativeStore(
    req.params.initiativeStoreId,
  );

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  return res.status(200).send({
    status: 'success',
    message: 'Initiative store restored successfully',
  });
};

const addGamePrize = async (req, res) => {
  const { error } = validateGamePrizeData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoreService.addGamePrize({
    initiativeStoreId: req.params.initiativeStoreId,
    gamePrizeData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game prize added successfully',
  });
};

const updateGamePrizeDetails = async (req, res) => {
  const { error } = validateGamePrizeData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoreService.updateGamePrizeDetails({
    initiativeStoreId: req.params.initiativeStoreId,
    gamePrizeId: req.params.gamePrizeId,
    gamePrizeData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game prize details updated successfully',
  });
};

const deleteGamePrize = async (req, res) => {
  await initiativeStoreService.deleteGamePrize({
    initiativeStoreId: req.params.initiativeStoreId,
    gamePrizeId: req.params.gamePrizeId,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game prize deleted successfully',
  });
};

const addGamePrizeToInitiativeStores = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().min(24).max(24).required(),
    name: Joi.string().required(),
    rank: Joi.number().options({ convert: false }).required(),
    entries: Joi.array()
      .items({
        initiativeStoreId: Joi.string().min(24).max(24).required(),
        quantity: Joi.number().options({ convert: false }).required(),
      })
      .min(2)
      .unique((a, b) => a.initiativeStoreId === b.initiativeStoreId) // Prevent duplicate initiativeStoreId
      .required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoreService.addGamePrizeToInitiativeStores(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Game prize added to stores successfully',
  });
};

module.exports = {
  createInitiativeStore,
  getInitiativeStores,
  getInitiativeStoresInExcel,
  getAssignedInitiativeStores,
  getInitiativeStoreDetails,
  getInitiativeStoresWithNoSubmission,
  getInitiativeStoresWithNoSubmissionInExcel,
  updateInitiativeStore,
  deleteInitiativeStore,
  softDeleteInitiativeStore,
  restoreInitiativeStore,
  addGamePrize,
  updateGamePrizeDetails,
  deleteGamePrize,
  addGamePrizeToInitiativeStores,
};
