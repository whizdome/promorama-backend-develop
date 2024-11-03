const Joi = require('joi');
const httpError = require('http-errors');

const mustStockListService = require('../services/mustStockList.service');
const { sendExcelFile } = require('../helpers/excel');

const validateMSLData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    level: Joi.number().min(0).max(1).options({ convert: false }).required(),
    state: Joi.string().required(),
    comment: Joi.string(),
    imageURL: Joi.string(),
  });

  return schema.validate(data);
};

const addMSL = async (req, res) => {
  const { error } = validateMSLData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await mustStockListService.addMSL({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'MSL added successfully',
  });
};

const addBulkMSLs = async (req, res) => {
  const { error } = Joi.object({
    date: Joi.date().iso().required(),
    products: Joi.array()
      .items({
        brandName: Joi.string().required(),
        sku: Joi.string().required(),
        level: Joi.number().min(0).max(1).options({ convert: false }).required(),
        comment: Joi.string(),
        imageURL: Joi.string(),
      })
      .min(2)
      .required(),
  }).validate(req.body, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  await mustStockListService.addBulkMSLs({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'MSLs added successfully',
  });
};

const getMSLs = async (req, res) => {
  const { MSLs, totalCount } = await mustStockListService.getMSLs(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'MSLs retrieved successfully',
    totalCount,
    data: MSLs,
  });
};

const getAggregateMSLs = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await mustStockListService.getAggregateMSLs(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'MSLs aggregate retrieved successfully',
    data,
  });
};

const getAggregateMSLsByStore = async (req, res) => {
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
  })
    .and('brandName', 'sku')
    .validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await mustStockListService.getAggregateMSLsByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'MSLs aggregate retrieved successfully',
    data,
  });
};

const getMSLsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await mustStockListService.getMSLsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'MSLs.xlsx' });
};

const updateMSLDetails = async (req, res) => {
  const { error } = validateMSLData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await mustStockListService.updateMSLDetails({
    id: req.params.id,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'MSL updated successfully',
  });
};

const deleteMSL = async (req, res) => {
  await mustStockListService.deleteMSL({
    id: req.params.id,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'MSL deleted successfully',
  });
};

module.exports = {
  addMSL,
  addBulkMSLs,
  getMSLs,
  getAggregateMSLs,
  getAggregateMSLsByStore,
  getMSLsInExcel,
  updateMSLDetails,
  deleteMSL,
};
