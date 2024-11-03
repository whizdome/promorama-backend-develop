/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const { StatusCodes } = require('http-status-codes');
const Joi = require('joi');
const createHttpError = require('http-errors');
const { getAggregateSalesByStore } = require('../services/sale.service');
const { getAggregateInventoriesByStore } = require('../services/inventory.service');
const { getAggregateMSLsByStore } = require('../services/mustStockList.service');
const {
  getAggregateSOSsByStore,
  getAggregateSOSsByStoreAndProduct,
} = require('../services/shareOfShelf.service');
const { getAggregateStoreInventoriesByStore } = require('../services/storeInventory.service');
const { getAggregateShipmentsByStore } = require('../services/shipment.service');
const { getAggregateOrdersByStore } = require('../services/order.service');

const aggregateData = (result, data, key, mapFn) => {
  data.forEach((element) => {
    const storeName = `${element?.store?.name}, ${element?.store?.town}`;
    if (!storeName) return;

    if (!result[storeName]) result[storeName] = {};
    result[storeName][key] = mapFn(element);
  });
};

const aggregateSOSCategories = (result, data, key, mapFn) => {
  data.forEach((element) => {
    const storeName = `${element?.store?.name}, ${element?.store?.town}`;
    if (!storeName) return;

    if (!result[storeName]) result[storeName] = {};
    result[storeName][element?.sku] = mapFn(element);
  });
};

const dataTable = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    brandName: Joi.string(),
    sku: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    states: Joi.string(),
    initiativeStoreIDs: Joi.string(),
    products: Joi.string(),
  })
    .and('brandName', 'sku')
    .validate(req.query);

  if (error) throw new createHttpError.BadRequest(error.message);

  try {
    const result = {};
    const salesResult = await getAggregateSalesByStore(req.query);
    const inventoriesResult = await getAggregateInventoriesByStore(req.query);
    const mslResult = await getAggregateMSLsByStore(req.query);
    const sosResult = await getAggregateSOSsByStore(req.query);
    const storeInventoryResult = await getAggregateStoreInventoriesByStore(req.query);
    const oosResult = await getAggregateInventoriesByStore({ ...req.query, level: 0 });
    const shipmentResult = await getAggregateShipmentsByStore(req.query);
    const orderResult = await getAggregateOrdersByStore(req.query);
    const sosCategoryResult = await getAggregateSOSsByStoreAndProduct(req.query);

    aggregateData(result, salesResult, 'sales', (element) => ({
      total: element?.totalCase,
      value: element?.totalValue,
    }));

    aggregateData(result, inventoriesResult, 'shelfInventory', (element) => ({
      total: element?.totalCase,
      value: element?.totalValue,
    }));

    aggregateData(result, mslResult, 'msl', (element) => ({
      avg: element?.avg,
    }));

    aggregateData(result, sosResult, 'sos', (element) => ({
      total: element?.total,
      avg: element?.avg,
    }));

    aggregateData(result, storeInventoryResult, 'storeInventory', (element) => ({
      totalCase: element?.totalCase,
      totalValue: element?.totalValue,
    }));

    aggregateData(result, oosResult, 'oos', (element) => ({
      entries: element?.count,
    }));

    aggregateData(result, shipmentResult, 'shipment', (element) => ({
      totalCase: element?.totalCase,
      totalValue: element?.totalValue,
    }));

    aggregateData(result, orderResult, 'orders', (element) => ({
      total: element?.total,
      avg: element?.avg,
    }));

    aggregateSOSCategories(result, sosCategoryResult, 'SOS Categories', (element) => ({
      total: element?.total,
      avg: element?.avg,
    }));

    return res.status(StatusCodes.OK).json({ msg: 'data table sent', result });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'unexpected error', error });
  }
};

module.exports = { dataTable };
