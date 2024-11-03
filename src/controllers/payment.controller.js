const Joi = require('joi');
const httpError = require('http-errors');

const paymentService = require('../services/payment.service');
const { sendExcelFile } = require('../helpers/excel');

const validatePaymentData = (data) => {
  const schema = Joi.object({
    date: Joi.date().iso().required(),
    brandName: Joi.string().required(),
    sku: Joi.string().required(),
    value: Joi.number().options({ convert: false }).required(),
    state: Joi.string().required(),
    comment: Joi.string(),
    imageURL: Joi.string(),
  });

  return schema.validate(data);
};

const addPayment = async (req, res) => {
  const { error } = validatePaymentData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await paymentService.addPayment({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Payment added successfully',
  });
};

const getPayments = async (req, res) => {
  const { payments, totalCount } = await paymentService.getPayments(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Payments retrieved successfully',
    totalCount,
    data: payments,
  });
};

const getAggregatePayments = async (req, res) => {
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

  const data = await paymentService.getAggregatePayments(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Payments aggregate retrieved successfully',
    data,
  });
};

const getAggregatePaymentsByStore = async (req, res) => {
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

  const data = await paymentService.getAggregatePaymentsByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Payments aggregate retrieved successfully',
    data,
  });
};

const getPaymentsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await paymentService.getPaymentsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'payments.xlsx' });
};

const updatePaymentDetails = async (req, res) => {
  const { error } = validatePaymentData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await paymentService.updatePaymentDetails({
    paymentId: req.params.paymentId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Payment updated successfully',
  });
};

const deletePayment = async (req, res) => {
  await paymentService.deletePayment({
    paymentId: req.params.paymentId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Payment deleted successfully',
  });
};

module.exports = {
  addPayment,
  getPayments,
  getAggregatePayments,
  getAggregatePaymentsByStore,
  getPaymentsInExcel,
  updatePaymentDetails,
  deletePayment,
};
