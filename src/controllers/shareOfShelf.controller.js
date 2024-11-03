const Joi = require('joi');
const httpError = require('http-errors');

const shareOfShelfService = require('../services/shareOfShelf.service');
const { sendExcelFile } = require('../helpers/excel');

const validateSOSData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    value: Joi.number().options({ convert: false }).required(),
    state: Joi.string().required(),
    comment: Joi.string(),
    imageURL: Joi.string().required(),
  });

  return schema.validate(data);
};

const addSOS = async (req, res) => {
  const { error } = validateSOSData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await shareOfShelfService.addSOS({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'SOS added successfully',
  });
};

const getSOSs = async (req, res) => {
  const { SOSs, totalCount } = await shareOfShelfService.getSOSs(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'SOSs retrieved successfully',
    totalCount,
    data: SOSs,
  });
};

const getAggregateSOSs = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    // states: Joi.string(),
    // initiativeStoreIDs: Joi.string(),
    // products: Joi.string(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await shareOfShelfService.getAggregateSOSs(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'SOSs aggregate retrieved successfully',
    data,
  });
};

const getAggregateSOSsByStore = async (req, res) => {
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

  const data = await shareOfShelfService.getAggregateSOSsByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'SOSs aggregate retrieved successfully',
    data,
  });
};

const getAggregateSOSsByStoreAndProduct = async (req, res) => {
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

  const data = await shareOfShelfService.getAggregateSOSsByStoreAndProduct(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'SOSs aggregate retrieved successfully',
    data,
  });
};

const getSOSsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await shareOfShelfService.getSOSsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'SOSs.xlsx' });
};

const updateSOSDetails = async (req, res) => {
  const { error } = validateSOSData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await shareOfShelfService.updateSOSDetails({
    id: req.params.id,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'SOS updated successfully',
  });
};

const deleteSOS = async (req, res) => {
  await shareOfShelfService.deleteSOS({
    id: req.params.id,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'SOS deleted successfully',
  });
};

module.exports = {
  addSOS,
  getSOSs,
  getAggregateSOSs,
  getAggregateSOSsByStore,
  getAggregateSOSsByStoreAndProduct,
  getSOSsInExcel,
  updateSOSDetails,
  deleteSOS,
};
