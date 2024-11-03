const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const Inventory = require('../models/inventory.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const logger = require('../utils/customLogger');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addInventory = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, brandName, sku, level } = reqBody;

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

  const existingInventoryRecord = await Inventory.findOne({
    initiativeStore: initiativeStoreId,
    date,
    brandName,
    sku,
  });

  if (existingInventoryRecord) {
    throw new httpError.BadRequest(`The inventory has already been recorded`);
  }

  const { caseUnitsNumber, pricePerCase } = existingBrand;

  const totalCase = level / caseUnitsNumber;
  const totalValue = totalCase * pricePerCase;

  const inventory = await Inventory.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
    totalCase,
    totalValue,
  });

  return inventory;
};

const addBulkInventories = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, products } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId)
    .populate({ path: 'store', select: 'state' })
    .populate({ path: 'initiative', select: 'brands' });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity(
      'Initiative store is no longer linked to an initiative',
    );
  }

  if (!initiativeStore.initiative.brands?.length) {
    throw new httpError.BadRequest('No brands found on initiative');
  }

  const promises = products.map(async (product) => {
    try {
      const { brandName, sku, level } = product;

      const existingBrand = initiativeStore.initiative.brands.find(
        (brand) => brand.name === brandName && brand.sku === sku,
      );

      if (existingBrand) {
        const existingInventoryRecord = await Inventory.findOne({
          initiativeStore: initiativeStoreId,
          date,
          brandName,
          sku,
        });

        if (!existingInventoryRecord) {
          const { caseUnitsNumber, pricePerCase } = existingBrand;

          const totalCase = level / caseUnitsNumber;
          const totalValue = totalCase * pricePerCase;

          await Inventory.create({
            initiative: initiativeStore.initiative,
            initiativeStore: initiativeStoreId,
            user: currentUser.id,
            userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
            ...product,
            date,
            state: initiativeStore.state || initiativeStore.store.state,
            totalCase,
            totalValue,
          });
        } else {
          logger.info(`[AddBulkInventories]: ${brandName}-${sku} already recorded on ${date}`);
        }
      } else {
        logger.info(
          `[AddBulkInventories]: ${brandName}-${sku} does not exist on initiative brands`,
        );
      }
    } catch (error) {
      logger.error(
        `[AddBulkInventories]: Error processing bulk inventories for initiative store ${initiativeStoreId}: ${error.message}`,
      );
    }
  });

  await Promise.allSettled(promises).catch((error) => {
    logger.error(`[AddBulkInventories]: ${error.message}`);
  });
};

const getAllInventories = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(Inventory.find(filter), reqQuery)
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
    })
    .populate({ path: 'user', select: 'firstName lastName email phoneNumber profilePicture role' });

  const inventories = await apiFeatures.query;
  const totalCount = await Inventory.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { inventories, totalCount };
};

const getInventoriesInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Inventory.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const inventories = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return inventories.map((inventory) => ({
    Date: inventory.date,
    Brand: inventory.brandName,
    SKU: inventory.sku,
    Level: inventory.level,
    'Total Case': inventory.totalCase,
    'Total Value': inventory.totalValue,
    'Store Name': inventory.initiativeStore?.store?.name,
    LGA: inventory.initiativeStore?.store?.area,
    State: inventory.state,
    Comment: inventory.comment,
    Creator: `${inventory.user?.firstName || ''} ${inventory.user?.lastName || ''}`,
    'Creator Role': inventory.user?.role,
  }));
};

const getAggregateInventories = async (reqQuery) => {
  const { initiativeId, startDate, endDate, state, level } = reqQuery;

  const filterGroupingsResult = await processFilterGroupings(reqQuery);

  const filter = {
    initiative: new mongoose.Types.ObjectId(initiativeId),
    ...filterGroupingsResult,
  };

  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate || endDate) {
    filter.date = startDate || endDate;
  }

  if (state) filter.state = state;

  if (level) filter.level = Number(level);

  const inventoriesResult = await Inventory.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$level' },
        avg: { $avg: { $ifNull: ['$level', 0] } },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: { $ifNull: ['$totalCase', 0] } },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: { $ifNull: ['$totalValue', 0] } },
      },
    },
    {
      $sort: { total: -1 },
    },
    {
      $project: {
        _id: 0,
        brandName: '$_id.brandName',
        sku: '$_id.sku',
        count: 1,
        total: 1,
        avg: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
      },
    },
  ]);

  return inventoriesResult;
};

const getAggregateInventoriesByStore = async (reqQuery) => {
  const { initiativeId, brandName, sku, startDate, endDate, state, level } = reqQuery;

  const filterGroupingsResult = await processFilterGroupings(reqQuery);

  const filter = {
    initiative: new mongoose.Types.ObjectId(initiativeId),
    ...filterGroupingsResult,
  };

  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate || endDate) {
    filter.date = startDate || endDate;
  }

  if (brandName) {
    filter.brandName = brandName;
    filter.sku = sku;
  }

  if (state) filter.state = state;

  if (level) filter.level = Number(level);

  const inventoriesResult = await Inventory.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        total: { $sum: '$level' },
        avg: { $avg: { $ifNull: ['$level', 0] } },
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
      $sort: { total: -1 },
    },
    {
      $project: {
        _id: 0,
        initiativeStoreId: '$_id.initiativeStore',
        count: 1,
        total: 1,
        avg: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
        store: 1,
      },
    },
  ]);

  return inventoriesResult;
};

const updateInventoryDetails = async (data) => {
  const { inventoryId, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const { date, brandName, sku, level } = changes;

  const inventory = await Inventory.findById(inventoryId).populate({
    path: 'initiative',
    select: 'brands',
  });

  if (!inventory) throw new httpError.NotFound('Inventory not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && inventory.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this inventory');
  }

  if (!inventory.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!inventory.initiative.brands?.length) {
    throw new httpError.BadRequest('No brands found on initiative');
  }

  const existingBrand = inventory.initiative.brands.find(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!existingBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on initiative brands`);
  }

  const existingInventoryRecord = await Inventory.findOne({
    _id: { $ne: inventoryId },
    initiativeStore: inventory.initiativeStore,
    date,
    brandName,
    sku,
  });

  if (existingInventoryRecord) {
    throw new httpError.BadRequest(`The inventory has already been recorded`);
  }

  const { caseUnitsNumber, pricePerCase } = existingBrand;

  const totalCase = level / caseUnitsNumber;
  const totalValue = totalCase * pricePerCase;

  await Inventory.updateOne({ _id: inventoryId }, { ...changes, totalCase, totalValue });
};

const deleteInventory = async (data) => {
  const { inventoryId, currentUser } = data;

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new httpError.NotFound('Inventory not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && inventory.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this inventory');
  }

  await Inventory.deleteOne({ _id: inventoryId });
};

module.exports = {
  addInventory,
  addBulkInventories,
  getAllInventories,
  getInventoriesInExcel,
  getAggregateInventories,
  getAggregateInventoriesByStore,
  updateInventoryDetails,
  deleteInventory,
};
