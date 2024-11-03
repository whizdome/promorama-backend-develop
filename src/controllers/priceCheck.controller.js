const Joi = require('joi');
const httpError = require('http-errors');

const priceCheckService = require('../services/priceCheck.service');
const { sendExcelFile } = require('../helpers/excel');

const validatePriceCheckData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    price: Joi.number().options({ convert: false }).required(),
    isPromoOn: Joi.boolean().options({ convert: false }),
    imageURL: Joi.string(),
    comment: Joi.string(),
    state: Joi.string().required(),
  });

  return schema.validate(data);
};

const addPriceCheck = async (req, res) => {
  const { error } = validatePriceCheckData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await priceCheckService.addPriceCheck({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Price check added successfully',
  });
};

const addBulkPriceChecks = async (req, res) => {
  const { error } = Joi.object({
    date: Joi.date().iso().required(),
    products: Joi.array()
      .items({
        brandName: Joi.string().required(),
        sku: Joi.string().required(),
        price: Joi.number().options({ convert: false }).required(),
        isPromoOn: Joi.boolean().options({ convert: false }),
        comment: Joi.string(),
        imageURL: Joi.string(),
      })
      .min(2)
      .required(),
  }).validate(req.body, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  await priceCheckService.addBulkPriceChecks({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Price checks added successfully',
  });
};

const getAllPriceChecks = async (req, res) => {
  const { priceChecks, totalCount } = await priceCheckService.getAllPriceChecks(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Price checks retrieved successfully',
    totalCount,
    data: priceChecks,
  });
};

const getPriceChecksInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await priceCheckService.getPriceChecksInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'price_checks.xlsx' });
};

const getAggregatePriceChecks = async (req, res) => {
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

  const data = await priceCheckService.getAggregatePriceChecks(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Price checks aggregate retrieved successfully',
    data,
  });
};

const getAggregatePriceChecksByStore = async (req, res) => {
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

  const data = await priceCheckService.getAggregatePriceChecksByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Price checks aggregate retrieved successfully',
    data,
  });
};

const updatePriceCheckDetails = async (req, res) => {
  const { error } = validatePriceCheckData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await priceCheckService.updatePriceCheckDetails({
    priceCheckId: req.params.priceCheckId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Price check updated successfully',
  });
};

const deletePriceCheck = async (req, res) => {
  await priceCheckService.deletePriceCheck({
    priceCheckId: req.params.priceCheckId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Price check deleted successfully',
  });
};

module.exports = {
  addPriceCheck,
  getAllPriceChecks,
  addBulkPriceChecks,
  getPriceChecksInExcel,
  getAggregatePriceChecks,
  getAggregatePriceChecksByStore,
  updatePriceCheckDetails,
  deletePriceCheck,
};
