const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const PriceCheck = require('../models/priceCheck.model');

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

const addPriceCheck = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { brandName, sku } = reqBody;

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

  const isValidBrand = initiativeStore.initiative.brands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on initiative brands`);
  }

  const priceCheck = await PriceCheck.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
  });

  return priceCheck;
};

const addBulkPriceChecks = async (data) => {
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
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.brands?.length) {
    throw new httpError.BadRequest('No brands found on initiative');
  }

  const promises = products.map(async (product) => {
    try {
      const { brandName, sku } = product;

      const isValidBrand = initiativeStore.initiative.brands.some(
        (brand) => brand.name === brandName && brand.sku === sku,
      );

      if (isValidBrand) {
        await PriceCheck.create({
          initiative: initiativeStore.initiative,
          initiativeStore: initiativeStoreId,
          user: currentUser.id,
          userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
          ...product,
          date,
          state: initiativeStore.state || initiativeStore.store.state,
        });
      } else {
        logger.info(
          `[AddBulkPriceChecks]: ${brandName}-${sku} does not exist on initiative brands`,
        );
      }
    } catch (error) {
      logger.error(
        `[AddBulkPriceChecks]: Error processing bulk price checks for initiative store ${initiativeStoreId}: ${error.message}`,
      );
    }
  });

  await Promise.allSettled(promises).catch((error) => {
    logger.error(`[AddBulkPriceChecks]: ${error.message}`);
  });
};

const getAllPriceChecks = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(PriceCheck.find(filter), reqQuery)
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

  const priceChecks = await apiFeatures.query;
  const totalCount = await PriceCheck.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { priceChecks, totalCount };
};

const getPriceChecksInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(PriceCheck.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const priceChecks = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return priceChecks.map((priceCheck) => ({
    Date: priceCheck.date,
    Brand: priceCheck.brandName,
    SKU: priceCheck.sku,
    Price: priceCheck.price,
    'Promo Status': priceCheck.isPromoOn,
    Comment: priceCheck.comment,
    'Store Name': priceCheck.initiativeStore?.store?.name,
    LGA: priceCheck.initiativeStore?.store?.area,
    State: priceCheck.state,
    Creator: `${priceCheck.user?.firstName || ''} ${priceCheck.user?.lastName || ''}`,
    'Creator Role': priceCheck.user?.role,
  }));
};

const getAggregatePriceChecks = async (reqQuery) => {
  const { initiativeId, startDate, endDate, state } = reqQuery;

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

  const result = await PriceCheck.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$price' },
        avg: { $avg: { $ifNull: ['$price', 0] } },
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
      },
    },
  ]);

  return result;
};

const getAggregatePriceChecksByStore = async (reqQuery) => {
  const { initiativeId, brandName, sku, startDate, endDate, state } = reqQuery;

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

  const result = await PriceCheck.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        total: { $sum: '$price' },
        avg: { $avg: { $ifNull: ['$price', 0] } },
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
        store: 1,
      },
    },
  ]);

  return result;
};

const updatePriceCheckDetails = async (data) => {
  const { priceCheckId, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const { brandName, sku } = changes;

  const priceCheck = await PriceCheck.findById(priceCheckId).populate({
    path: 'initiative',
    select: 'brands',
  });

  if (!priceCheck) throw new httpError.NotFound('Price check not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && priceCheck.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this data');
  }

  if (!priceCheck.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!priceCheck.initiative.brands?.length) {
    throw new httpError.BadRequest('No brands found on initiative');
  }

  const isValidBrand = priceCheck.initiative.brands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on initiative brands`);
  }

  await PriceCheck.updateOne({ _id: priceCheckId }, changes);
};

const deletePriceCheck = async (data) => {
  const { priceCheckId, currentUser } = data;

  const priceCheck = await PriceCheck.findById(priceCheckId);
  if (!priceCheck) throw new httpError.NotFound('Price check not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && priceCheck.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this data');
  }

  await PriceCheck.deleteOne({ _id: priceCheckId });
};

module.exports = {
  addPriceCheck,
  addBulkPriceChecks,
  getAllPriceChecks,
  getPriceChecksInExcel,
  getAggregatePriceChecks,
  getAggregatePriceChecksByStore,
  updatePriceCheckDetails,
  deletePriceCheck,
};
