const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const StoreInventory = require('../models/storeInventory.model');

const APIFeatures = require('../utils/apiFeatures');
const { EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addStoreInventory = async (data) => {
  const { initiativeStoreId, reqBody } = data;
  const { brandName, sku, availableStockQty } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'brands',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.brands?.length) {
    throw new httpError.BadRequest('No brands found on initiative');
  }

  const existingBrand = initiativeStore.initiative.brands.find(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!existingBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on initiative brands`);
  }

  const existingRecord = await StoreInventory.findOne({
    initiativeStore: initiativeStoreId,
    brandName,
    sku,
  });

  if (existingRecord) {
    throw new httpError.BadRequest(
      `The store inventory document for '${brandName}-${sku}' already exists`,
    );
  }

  const { caseUnitsNumber, pricePerCase } = existingBrand;

  const totalCase = availableStockQty / caseUnitsNumber;
  const totalValue = totalCase * pricePerCase;

  const storeInventory = new StoreInventory({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    ...reqBody,
    totalCase,
    totalValue,
  });
  await storeInventory.save();

  return storeInventory;
};

const getStoreInventories = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(StoreInventory.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: {
        path: 'store',
        select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
      },
    });

  const storeInventories = await apiFeatures.query;
  const totalCount = await StoreInventory.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { storeInventories, totalCount };
};

const getStoreInventoriesInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(StoreInventory.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const storeInventories = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    });

  return storeInventories.map((storeInventory) => ({
    'Store Name': storeInventory.initiativeStore?.store?.name,
    LGA: storeInventory.initiativeStore?.store?.area,
    State: storeInventory.state,
    Brand: storeInventory.brandName,
    SKU: storeInventory.sku,
    'Available Stock Qty': storeInventory.availableStockQty,
    'Total Case': storeInventory.totalCase,
    'Total Value': storeInventory.totalValue,
  }));
};

const getAggregateStoreInventories = async (reqQuery) => {
  const { initiativeId, state } = reqQuery;

  const filterGroupingsResult = await processFilterGroupings(reqQuery);

  const filter = {
    initiative: new mongoose.Types.ObjectId(initiativeId),
    ...filterGroupingsResult,
  };

  if (state) filter.state = state;

  const result = await StoreInventory.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        totalStockQty: { $sum: '$availableStockQty' },
        avgStockQty: { $avg: { $ifNull: ['$availableStockQty', 0] } },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: { $ifNull: ['$totalCase', 0] } },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: { $ifNull: ['$totalValue', 0] } },
      },
    },
    {
      $sort: { totalStockQty: -1 },
    },
    {
      $project: {
        _id: 0,
        brandName: '$_id.brandName',
        sku: '$_id.sku',
        count: 1,
        totalStockQty: 1,
        avgStockQty: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
      },
    },
  ]);

  return result;
};

const getAggregateStoreInventoriesByStore = async (reqQuery) => {
  const { initiativeId, brandName, sku, state } = reqQuery;

  const filterGroupingsResult = await processFilterGroupings(reqQuery);

  const filter = {
    initiative: new mongoose.Types.ObjectId(initiativeId),
    ...filterGroupingsResult,
  };

  if (brandName) {
    filter.brandName = brandName;
    filter.sku = sku;
  }

  if (state) filter.state = state;

  const result = await StoreInventory.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        totalStockQty: { $sum: '$availableStockQty' },
        avgStockQty: { $avg: { $ifNull: ['$availableStockQty', 0] } },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: { $ifNull: ['$totalCase', 0] } },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: { $ifNull: ['$totalValue', 0] } },
      },
    },
    {
      $lookup: {
        from: 'initiative_stores',
        localField: '_id.initiativeStore',
        foreignField: '_id',
        as: 'initiativeStore',
      },
    },
    {
      $lookup: {
        from: 'stores',
        localField: 'initiativeStore.store',
        foreignField: '_id',
        as: 'store',
        pipeline: [
          {
            $project: {
              name: 1,
              streetNumber: 1,
              streetName: 1,
              state: 1,
              area: 1,
              town: 1,
              ownerFirstName: 1,
              ownerLastName: 1,
              ownerPhoneNumber: 1,
              imageURL: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$store',
    },
    {
      $sort: { totalStockQty: -1 },
    },
    {
      $project: {
        _id: 0,
        initiativeStoreId: '$_id.initiativeStore',
        count: 1,
        totalStockQty: 1,
        avgStockQty: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
        store: 1,
      },
    },
  ]);

  return result;
};

const updateStoreInventoryDetails = async (data) => {
  const { storeInventoryId, changes } = data;
  const { brandName, sku, availableStockQty } = changes;

  const storeInventory = await StoreInventory.findById(storeInventoryId).populate({
    path: 'initiative',
    select: 'brands',
  });

  if (!storeInventory) throw new httpError.NotFound('Store inventory not found');

  if (!storeInventory.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!storeInventory.initiative.brands?.length) {
    throw new httpError.BadRequest('No brands found on initiative');
  }

  const existingBrand = storeInventory.initiative.brands.find(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!existingBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on initiative brands`);
  }

  const existingRecord = await StoreInventory.findOne({
    _id: { $ne: storeInventoryId },
    initiativeStore: storeInventory.initiativeStore,
    brandName,
    sku,
  });

  if (existingRecord) {
    throw new httpError.BadRequest(
      `The store inventory document for '${brandName}-${sku}' already exists`,
    );
  }

  const { caseUnitsNumber, pricePerCase } = existingBrand;

  const totalCase = availableStockQty / caseUnitsNumber;
  const totalValue = totalCase * pricePerCase;

  await StoreInventory.updateOne({ _id: storeInventoryId }, { ...changes, totalCase, totalValue });
};

const deleteStoreInventory = async (storeInventoryId) => {
  const storeInventory = await StoreInventory.findByIdAndDelete(storeInventoryId);

  if (!storeInventory) throw new httpError.NotFound('Store inventory not found');
};

module.exports = {
  addStoreInventory,
  getStoreInventories,
  getStoreInventoriesInExcel,
  getAggregateStoreInventories,
  getAggregateStoreInventoriesByStore,
  updateStoreInventoryDetails,
  deleteStoreInventory,
};
