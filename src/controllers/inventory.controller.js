const Joi = require('joi');
const httpError = require('http-errors');

const inventoryService = require('../services/inventory.service');
const { sendExcelFile } = require('../helpers/excel');

const validateInventoryData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    level: Joi.number().options({ convert: false }).required(),
    state: Joi.string().required(),
    comment: Joi.string(),
    imageURL: Joi.string(),
  });

  return schema.validate(data);
};

const addInventory = async (req, res) => {
  const { error } = validateInventoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await inventoryService.addInventory({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Inventory added successfully',
  });
};

const addBulkInventories = async (req, res) => {
  const { error } = Joi.object({
    date: Joi.date().iso().required(),
    products: Joi.array()
      .items({
        brandName: Joi.string().required(),
        sku: Joi.string().required(),
        level: Joi.number().options({ convert: false }).required(),
        comment: Joi.string(),
        imageURL: Joi.string(),
      })
      .min(2)
      .required(),
  }).validate(req.body, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  await inventoryService.addBulkInventories({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Inventories added successfully',
  });
};

const getAllInventories = async (req, res) => {
  const { inventories, totalCount } = await inventoryService.getAllInventories(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Inventories retrieved successfully',
    totalCount,
    data: inventories,
  });
};

const getInventoriesInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await inventoryService.getInventoriesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'inventories.xlsx' });
};

const getAggregateInventories = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
    level: Joi.number(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await inventoryService.getAggregateInventories(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Inventories aggregate retrieved successfully',
    data,
  });
};

const getAggregateInventoriesByStore = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    brandName: Joi.string(),
    sku: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
    level: Joi.number(),
  })
    .and('brandName', 'sku')
    .validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await inventoryService.getAggregateInventoriesByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Inventories aggregate retrieved successfully',
    data,
  });
};

const updateInventoryDetails = async (req, res) => {
  const { error } = validateInventoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await inventoryService.updateInventoryDetails({
    inventoryId: req.params.inventoryId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Inventory updated successfully',
  });
};

const deleteInventory = async (req, res) => {
  await inventoryService.deleteInventory({
    inventoryId: req.params.inventoryId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Inventory deleted successfully',
  });
};

module.exports = {
  addInventory,
  addBulkInventories,
  getAllInventories,
  getInventoriesInExcel,
  getAggregateInventories,
  getAggregateInventoriesByStore,
  updateInventoryDetails,
  deleteInventory,
};
