const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const MustStockList = require('../models/mustStockList.model');

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

const addMSL = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, brandName, sku } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'mslBrands',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.mslBrands?.length) {
    throw new httpError.BadRequest('No MSL brands found on initiative');
  }

  const isValidBrand = initiativeStore.initiative.mslBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on MSL brands`);
  }

  const existingMSLRecord = await MustStockList.findOne({
    initiativeStore: initiativeStoreId,
    date,
    brandName,
    sku,
  });

  if (existingMSLRecord) throw new httpError.BadRequest(`The MSL has already been recorded`);

  const MSL = await MustStockList.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
  });

  return MSL;
};

const addBulkMSLs = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, products } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId)
    .populate({ path: 'store', select: 'state' })
    .populate({ path: 'initiative', select: 'mslBrands' });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.mslBrands?.length) {
    throw new httpError.BadRequest('No MSL brands found on initiative');
  }

  const promises = products.map(async (product) => {
    try {
      const { brandName, sku } = product;

      const isValidBrand = initiativeStore.initiative.mslBrands.some(
        (brand) => brand.name === brandName && brand.sku === sku,
      );

      if (isValidBrand) {
        const existingMSLRecord = await MustStockList.findOne({
          initiativeStore: initiativeStoreId,
          date,
          brandName,
          sku,
        });

        if (!existingMSLRecord) {
          await MustStockList.create({
            initiative: initiativeStore.initiative,
            initiativeStore: initiativeStoreId,
            user: currentUser.id,
            userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
            ...product,
            date,
            state: initiativeStore.state || initiativeStore.store.state,
          });
        } else {
          logger.info(`[AddBulkMSLs]: ${brandName}-${sku} already recorded on ${date}`);
        }
      } else {
        logger.info(`[AddBulkMSLs]: ${brandName}-${sku} does not exist on msl brands`);
      }
    } catch (error) {
      logger.error(
        `[AddBulkMSLs]: Error processing bulk MSLs for initiative store ${initiativeStoreId}: ${error.message}`,
      );
    }
  });

  await Promise.allSettled(promises).catch((error) => {
    logger.error(`[AddBulkMSLs]: ${error.message}`);
  });
};

const getMSLs = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(MustStockList.find(filter), reqQuery)
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

  const MSLs = await apiFeatures.query;
  const totalCount = await MustStockList.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { MSLs, totalCount };
};

const getAggregateMSLs = async (reqQuery) => {
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

  const result = await MustStockList.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$level' },
        avg: { $avg: { $ifNull: ['$level', 0] } },
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

const getAggregateMSLsByStore = async (reqQuery) => {
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

  const result = await MustStockList.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        total: { $sum: '$level' },
        avg: { $avg: { $ifNull: ['$level', 0] } },
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

const getMSLsInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(MustStockList.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const MSLs = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return MSLs.map((MSL) => ({
    'Store Name': MSL.initiativeStore?.store?.name,
    LGA: MSL.initiativeStore?.store?.area,
    State: MSL.state,
    Date: MSL.date,
    Brand: MSL.brandName,
    SKU: MSL.sku,
    Level: MSL.level,
    Comment: MSL.comment,
    'Image URL': MSL.imageURL,
    Creator: `${MSL.user?.firstName || ''} ${MSL.user?.lastName || ''}`,
    'Creator Role': MSL.user?.role,
  }));
};

const updateMSLDetails = async (data) => {
  const { id, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const { date, brandName, sku } = changes;

  const MSL = await MustStockList.findById(id).populate({
    path: 'initiative',
    select: 'mslBrands',
  });

  if (!MSL) throw new httpError.NotFound('MSL not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && MSL.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this MSL');
  }

  if (!MSL.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!MSL.initiative.mslBrands?.length) {
    throw new httpError.BadRequest('No MSL brands found on initiative');
  }

  const isValidBrand = MSL.initiative.mslBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on MSL brands`);
  }

  const existingMSLRecord = await MustStockList.findOne({
    _id: { $ne: id },
    initiativeStore: MSL.initiativeStore,
    date,
    brandName,
    sku,
  });

  if (existingMSLRecord) throw new httpError.BadRequest(`The MSL has already been recorded`);

  await MustStockList.updateOne({ _id: id }, changes);
};

const deleteMSL = async (data) => {
  const { id, currentUser } = data;

  const MSL = await MustStockList.findById(id);
  if (!MSL) throw new httpError.NotFound('MSL not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && MSL.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this MSL');
  }

  await MustStockList.deleteOne({ _id: id });
};

module.exports = {
  addMSL,
  addBulkMSLs,
  getMSLs,
  getAggregateMSLs,
  getAggregateMSLsByStore,
  getMSLsInExcel,
  updateMSLDetails,
  deleteMSL,
};
