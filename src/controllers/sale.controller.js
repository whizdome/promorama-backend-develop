const Joi = require('joi');
const httpError = require('http-errors');

const saleService = require('../services/sale.service');
const { sendExcelFile } = require('../helpers/excel');

const validateSaleData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    unitsSold: Joi.number().options({ convert: false }).required(),
    state: Joi.string().required(),
    comment: Joi.string(),
  });

  return schema.validate(data);
};

const addSale = async (req, res) => {
  const { error } = validateSaleData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await saleService.addSale({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Sale added successfully',
  });
};

const getAllSales = async (req, res) => {
  const { sales, totalCount } = await saleService.getAllSales(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Sales retrieved successfully',
    totalCount,
    data: sales,
  });
};

const getSalesInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await saleService.getSalesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'sales.xlsx' });
};

const getAggregateSales = async (req, res) => {
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

  const data = await saleService.getAggregateSales(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Sales aggregate retrieved successfully',
    data,
  });
};

const getAggregateSalesByStore = async (req, res) => {
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

  const data = await saleService.getAggregateSalesByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Sales aggregate retrieved successfully',
    data,
  });
};

const getInitiativeSalesAnalytics = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    target: Joi.number().required(),
    durationInDays: Joi.number().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const analytics = await saleService.getInitiativeSalesAnalytics(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Sales analytics retrieved successfully',
    data: analytics,
  });
};

const getInitiativeStoreSalesAnalytics = async (req, res) => {
  const { error } = Joi.object({
    initiativeStoreId: Joi.string().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    target: Joi.number().required(),
    durationInDays: Joi.number().required(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const analytics = await saleService.getInitiativeStoreSalesAnalytics(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Sales analytics retrieved successfully',
    data: analytics,
  });
};

const getMonthlyAggregateSales = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    year: Joi.date().iso().required(),
    state: Joi.string(),
    statesFilterGroupId: Joi.string(),
    productsFilterGroupId: Joi.string(),
    initiativeStoresFilterGroupId: Joi.string(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await saleService.getMonthlyAggregateSales(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Sales aggregate retrieved successfully',
    data,
  });
};

const deleteSale = async (req, res) => {
  await saleService.deleteSale({
    saleId: req.params.saleId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Sale deleted successfully',
  });
};

module.exports = {
  addSale,
  getAllSales,
  getSalesInExcel,
  getAggregateSales,
  getAggregateSalesByStore,
  getInitiativeSalesAnalytics,
  getInitiativeStoreSalesAnalytics,
  getMonthlyAggregateSales,
  deleteSale,
};
