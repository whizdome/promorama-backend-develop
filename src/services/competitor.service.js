const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const Competitor = require('../models/competitor.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addCompetitor = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId);

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  const competitor = await Competitor.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
  });

  return competitor;
};

const getAllCompetitors = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(Competitor.find(filter), reqQuery)
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

  const competitors = await apiFeatures.query;
  const totalCount = await Competitor.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { competitors, totalCount };
};

const getCompetitorsInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Competitor.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const competitors = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return competitors.map((competitor) => ({
    Date: competitor.date,
    Brand: competitor.brandName,
    SKU: competitor.sku,
    Price: competitor.price,
    'Promo Status': competitor.isPromoOn,
    Comment: competitor.comment,
    'Store Name': competitor.initiativeStore?.store?.name,
    LGA: competitor.initiativeStore?.store?.area,
    State: competitor.state,
    Creator: `${competitor.user?.firstName || ''} ${competitor.user?.lastName || ''}`,
    'Creator Role': competitor.user?.role,
  }));
};

const getAggregateCompetitors = async (reqQuery) => {
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

  const competitorsResult = await Competitor.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$price' },
        avg: { $avg: { $ifNull: ['$price', 0] } },
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

  return competitorsResult;
};

const getAggregateCompetitorsByStore = async (reqQuery) => {
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

  const competitorsResult = await Competitor.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        total: { $sum: '$price' },
        avg: { $avg: { $ifNull: ['$price', 0] } },
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

  return competitorsResult;
};

const updateCompetitorDetails = async (data) => {
  const { competitorId, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const competitor = await Competitor.findById(competitorId);

  if (!competitor) throw new httpError.NotFound('Competitor not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && competitor.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this competitor');
  }

  await Competitor.updateOne({ _id: competitorId }, changes);
};

const deleteCompetitor = async (data) => {
  const { competitorId, currentUser } = data;

  const competitor = await Competitor.findById(competitorId);
  if (!competitor) throw new httpError.NotFound('Competitor not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && competitor.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this competitor');
  }

  await Competitor.deleteOne({ _id: competitorId });
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
