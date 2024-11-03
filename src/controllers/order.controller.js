const Joi = require('joi');
const httpError = require('http-errors');

const orderService = require('../services/order.service');
const { sendExcelFile } = require('../helpers/excel');

const validateOrderData = (data) => {
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

const addOrder = async (req, res) => {
  const { error } = validateOrderData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await orderService.addOrder({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Order added successfully',
  });
};

const getOrders = async (req, res) => {
  const { orders, totalCount } = await orderService.getOrders(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Orders retrieved successfully',
    totalCount,
    data: orders,
  });
};

const getAggregateOrders = async (req, res) => {
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

  const data = await orderService.getAggregateOrders(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Orders aggregate retrieved successfully',
    data,
  });
};

const getAggregateOrdersByStore = async (req, res) => {
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

  const data = await orderService.getAggregateOrdersByStore(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Orders aggregate retrieved successfully',
    data,
  });
};

const getOrdersInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await orderService.getOrdersInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'orders.xlsx' });
};

const updateOrderDetails = async (req, res) => {
  const { error } = validateOrderData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await orderService.updateOrderDetails({
    orderId: req.params.orderId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Order updated successfully',
  });
};

const deleteOrder = async (req, res) => {
  await orderService.deleteOrder({
    orderId: req.params.orderId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Order deleted successfully',
  });
};

module.exports = {
  addOrder,
  getOrders,
  getAggregateOrders,
  getAggregateOrdersByStore,
  getOrdersInExcel,
  updateOrderDetails,
  deleteOrder,
};
