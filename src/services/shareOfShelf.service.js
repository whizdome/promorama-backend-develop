const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const ShareOfShelf = require('../models/shareOfShelf.model');
const Initiative = require('../models/initiative.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { parseProducts } = require('../helpers/parseProducts');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addSOS = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, brandName, sku } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'sosBrands',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.sosBrands?.length) {
    throw new httpError.BadRequest('No SOS brands found on initiative');
  }

  const isValidBrand = initiativeStore.initiative.sosBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on SOS brands`);
  }

  const existingSOSRecord = await ShareOfShelf.findOne({
    initiativeStore: initiativeStoreId,
    date,
    brandName,
    sku,
  });

  if (existingSOSRecord) throw new httpError.BadRequest(`The SOS has already been recorded`);

  const SOS = await ShareOfShelf.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
  });

  return SOS;
};

const getSOSs = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(ShareOfShelf.find(filter), reqQuery)
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

  const SOSs = await apiFeatures.query;
  const totalCount = await ShareOfShelf.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { SOSs, totalCount };
};

const getAggregateSOSs = async (reqQuery) => {
  // const { initiativeId, startDate, endDate, states, initiativeStoreIDs, products } = reqQuery;
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

  // if (states) filter.state = { $in: states.split(',') };

  // if (initiativeStoreIDs) {
  //   filter.initiativeStore = {
  //     $in: initiativeStoreIDs.split(',').map((id) => new mongoose.Types.ObjectId(id.trim())),
  //   };
  // }

  // if (products) {
  //   const { brandNames, SKUs } = parseProducts(products);
  //   filter.brandName = { $in: brandNames };
  //   filter.sku = { $in: SKUs };
  // }

  const result = await ShareOfShelf.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$value' },
        avg: { $avg: { $ifNull: ['$value', 0] } },
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

const getAggregateSOSsByStore = async (reqQuery) => {
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

  const result = await ShareOfShelf.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        total: { $sum: '$value' },
        avg: { $avg: { $ifNull: ['$value', 0] } },
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

const getAggregateSOSsByStoreAndProduct = async (reqQuery) => {
  const { initiativeId, brandName, sku, startDate, endDate, state } = reqQuery;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const parsedSosBrandsResult = parseProducts(initiative.sosBrands);

  const filterGroupingsResult = await processFilterGroupings(reqQuery);

  const filter = {
    initiative: new mongoose.Types.ObjectId(initiativeId),
    brandName: { $in: parsedSosBrandsResult.brandNames },
    sku: { $in: parsedSosBrandsResult.SKUs },
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

  const result = await ShareOfShelf.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore', brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$value' },
        avg: { $avg: { $ifNull: ['$value', 0] } },
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
        brandName: '$_id.brandName',
        sku: '$_id.sku',
        count: 1,
        total: 1,
        avg: 1,
        store: 1,
      },
    },
  ]);

  return result;
};

const getSOSsInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(ShareOfShelf.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const SOSs = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return SOSs.map((SOS) => ({
    'Store Name': SOS.initiativeStore?.store?.name,
    LGA: SOS.initiativeStore?.store?.area,
    State: SOS.state,
    Date: SOS.date,
    Brand: SOS.brandName,
    SKU: SOS.sku,
    Value: SOS.value,
    Comment: SOS.comment,
    'Image URL': SOS.imageURL,
    Creator: `${SOS.user?.firstName || ''} ${SOS.user?.lastName || ''}`,
    'Creator Role': SOS.user?.role,
  }));
};

const updateSOSDetails = async (data) => {
  const { id, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const { date, brandName, sku } = changes;

  const SOS = await ShareOfShelf.findById(id).populate({ path: 'initiative', select: 'sosBrands' });

  if (!SOS) throw new httpError.NotFound('SOS not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && SOS.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this SOS');
  }

  if (!SOS.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!SOS.initiative.sosBrands?.length) {
    throw new httpError.BadRequest('No SOS brands found on initiative');
  }

  const isValidBrand = SOS.initiative.sosBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on SOS brands`);
  }

  const existingSOSRecord = await ShareOfShelf.findOne({
    _id: { $ne: id },
    initiativeStore: SOS.initiativeStore,
    date,
    brandName,
    sku,
  });

  if (existingSOSRecord) throw new httpError.BadRequest(`The SOS has already been recorded`);

  await ShareOfShelf.updateOne({ _id: id }, changes);
};

const deleteSOS = async (data) => {
  const { id, currentUser } = data;

  const SOS = await ShareOfShelf.findById(id);
  if (!SOS) throw new httpError.NotFound('SOS not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && SOS.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this SOS');
  }

  await ShareOfShelf.deleteOne({ _id: id });
};

module.exports = {
  addSOS,
  getSOSs,
  getAggregateSOSs,
  getAggregateSOSsByStore,
  getAggregateSOSsByStoreAndProduct,
  getSOSsInExcel,
  updateSOSDetails,
  deleteSOS,
};
