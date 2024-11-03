const Joi = require('joi');
const httpError = require('http-errors');

const competitorService = require('../services/competitor.service');
const { sendExcelFile } = require('../helpers/excel');

const validateCompetitorData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    price: Joi.number().options({ convert: false }).required(),
    isPromoOn: Joi.boolean().options({ convert: false }).required(),
    imageURL: Joi.string(),
    comment: Joi.string(),
    state: Joi.string().required(),
  });

  return schema.validate(data);
};

const addCompetitor = async (req, res) => {
  const { error } = validateCompetitorData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await competitorService.addCompetitor({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Competitor added successfully',
  });
};

const getAllCompetitors = async (req, res) => {
  const { competitors, totalCount } = await competitorService.getAllCompetitors(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Competitors retrieved successfully',
    totalCount,
    data: competitors,
  });
};

const getCompetitorsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await competitorService.getCompetitorsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'competitors.xlsx' });
};

const getAggregateCompetitors = async (req, res) => {
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

  const data = await competitorService.getAggregateCompetitors(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Competitors aggregate retrieved successfully',
    data,
  });
};

const getAggregateCompetitorsByStore = async (req, res) => {
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

  const data = await competitorService.getAggregateCompetitorsByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Competitors aggregate retrieved successfully',
    data,
  });
};

const updateCompetitorDetails = async (req, res) => {
  const { error } = validateCompetitorData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await competitorService.updateCompetitorDetails({
    competitorId: req.params.competitorId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Competitor updated successfully',
  });
};

const deleteCompetitor = async (req, res) => {
  await competitorService.deleteCompetitor({
    competitorId: req.params.competitorId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Competitor deleted successfully',
  });
};

module.exports = {
  addCompetitor,
  getAllCompetitors,
  getCompetitorsInExcel,
  getAggregateCompetitors,
  getAggregateCompetitorsByStore,
  updateCompetitorDetails,
  deleteCompetitor,
};
