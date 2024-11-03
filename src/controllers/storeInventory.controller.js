const Joi = require('joi');
const httpError = require('http-errors');

const storeInventoryService = require('../services/storeInventory.service');
const { sendExcelFile } = require('../helpers/excel');

const validateStoreInventoryData = (data) => {
  const schema = Joi.object({
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    availableStockQty: Joi.number().options({ convert: false }).required(),
    state: Joi.string().required(),
  });

  return schema.validate(data);
};

const addStoreInventory = async (req, res) => {
  const { error } = validateStoreInventoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await storeInventoryService.addStoreInventory({
    initiativeStoreId: req.params.initiativeStoreId,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Store inventory added successfully',
  });
};

const getStoreInventories = async (req, res) => {
  const { storeInventories, totalCount } = await storeInventoryService.getStoreInventories(
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Store inventories retrieved successfully',
    totalCount,
    data: storeInventories,
  });
};

const getStoreInventoriesInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await storeInventoryService.getStoreInventoriesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'store_inventories.xlsx' });
};

const getAggregateStoreInventories = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await storeInventoryService.getAggregateStoreInventories(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Store inventories aggregate retrieved successfully',
    data,
  });
};

const getAggregateStoreInventoriesByStore = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    brandName: Joi.string(),
    sku: Joi.string(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
  })
    .and('brandName', 'sku')
    .validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await storeInventoryService.getAggregateStoreInventoriesByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Store inventories aggregate retrieved successfully',
    data,
  });
};

const updateStoreInventoryDetails = async (req, res) => {
  const { error } = validateStoreInventoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await storeInventoryService.updateStoreInventoryDetails({
    storeInventoryId: req.params.storeInventoryId,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Store inventory updated successfully',
  });
};

const deleteStoreInventory = async (req, res) => {
  await storeInventoryService.deleteStoreInventory(req.params.storeInventoryId);

  return res.status(200).send({
    status: 'success',
    message: 'Store inventory deleted successfully',
  });
};

module.exports = {
  addStoreInventory,
  getStoreInventories,
  getStoreInventoriesInExcel,
  getAggregateStoreInventories,
  getAggregateStoreInventoriesByStore,
  updateStoreInventoryDetails,
  deleteStoreInventory,
};
