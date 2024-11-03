const Joi = require('joi');
const httpError = require('http-errors');

const shipmentService = require('../services/shipment.service');
const { isCsvFile } = require('../utils/isCsvFile');
const { sendExcelFile } = require('../helpers/excel');

const validateShipmentData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    totalCase: Joi.number().options({ convert: false }).required(),
    state: Joi.string().required(),
    comment: Joi.string(),
    imageURL: Joi.string(),
  });

  return schema.validate(data);
};

const addShipment = async (req, res) => {
  const { error } = validateShipmentData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await shipmentService.addShipment({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Shipment added successfully',
  });
};

const addShipmentsViaUpload = async (req, res) => {
  if (!req.file) throw new httpError.BadRequest('No file uploaded');

  if (!isCsvFile(req.file)) throw new httpError.BadRequest('Uploaded file must be a CSV file');

  const parsedData = await shipmentService.addShipmentsViaUpload({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    file: req.file,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Shipments added successfully',
    data: parsedData,
  });
};

const getShipments = async (req, res) => {
  const { shipments, totalCount } = await shipmentService.getShipments(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Shipments retrieved successfully',
    totalCount,
    data: shipments,
  });
};

const getAggregateShipments = async (req, res) => {
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

  const data = await shipmentService.getAggregateShipments(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Shipments aggregate retrieved successfully',
    data,
  });
};

const getAggregateShipmentsByStore = async (req, res) => {
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

  const data = await shipmentService.getAggregateShipmentsByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Shipments aggregate retrieved successfully',
    data,
  });
};

const getShipmentsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await shipmentService.getShipmentsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'shipments.xlsx' });
};

const deleteShipment = async (req, res) => {
  await shipmentService.deleteShipment({
    shipmentId: req.params.shipmentId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Shipment deleted successfully',
  });
};

module.exports = {
  addShipment,
  addShipmentsViaUpload,
  getShipments,
  getAggregateShipments,
  getAggregateShipmentsByStore,
  getShipmentsInExcel,
  deleteShipment,
};
