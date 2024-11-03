const httpError = require('http-errors');
const mongoose = require('mongoose');

const Initiative = require('../models/initiative.model');
const InitiativeStore = require('../models/initiativeStore.model');
const Sale = require('../models/sale.model');
const StoreInventory = require('../models/storeInventory.model');

const APIFeatures = require('../utils/apiFeatures');
const getDateDifferenceInDays = require('../utils/getDateDifferenceInDays');
const {
  MODEL_NAME,
  ROLE_TO_MODEL_MAPPING,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addSale = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, brandName, sku, unitsSold } = reqBody;

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

  const existingSaleRecord = await Sale.findOne({
    initiativeStore: initiativeStoreId,
    date,
    brandName,
    sku,
  });

  if (existingSaleRecord) throw new httpError.BadRequest(`The sale has already been recorded`);

  const storeInventory = await StoreInventory.findOne({
    initiativeStore: initiativeStoreId,
    brandName,
    sku,
  });

  if (!storeInventory) throw new httpError.NotFound('Store inventory document not found');

  if (storeInventory.availableStockQty < unitsSold) {
    throw new httpError.BadRequest(
      `The available stock quantity in the store's inventory is insufficient`,
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { caseUnitsNumber, pricePerCase } = existingBrand;

    const totalCase = unitsSold / caseUnitsNumber;
    const totalValue = totalCase * pricePerCase;

    const sale = new Sale({
      initiative: initiativeStore.initiative,
      initiativeStore: initiativeStoreId,
      user: currentUser.id,
      userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
      ...reqBody,
      totalCase,
      totalValue,
    });
    await sale.save({ session });

    storeInventory.availableStockQty -= sale.unitsSold;
    storeInventory.totalCase = storeInventory.availableStockQty / caseUnitsNumber;
    storeInventory.totalValue = storeInventory.totalCase * pricePerCase;
    await storeInventory.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sale;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const getAllSales = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(Sale.find(filter), reqQuery)
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

  const sales = await apiFeatures.query;
  const totalCount = await Sale.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { sales, totalCount };
};

const getSalesInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Sale.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const sales = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return sales.map((sale) => ({
    Date: sale.date,
    'Store Name': sale.initiativeStore?.store?.name,
    Brand: sale.brandName,
    SKU: sale.sku,
    'Units Sold': sale.unitsSold,
    'Total Case': sale.totalCase,
    'Total Value': sale.totalValue,
    'Store ID': sale.initiativeStore?.store?.id,
    'Store Phone Number': sale.initiativeStore?.store?.phoneNumber,
    'Store Type': sale.initiativeStore?.store?.type,
    LGA: sale.initiativeStore?.store?.area,
    State: sale.state,
    Comment: sale.comment,
    Creator: `${sale.user?.firstName || ''} ${sale.user?.lastName || ''}`,
    'Creator Role': sale.user?.role,
    'Created At': sale.createdAt.toLocaleString('en-US'),
  }));
};

const getAggregateSales = async (reqQuery) => {
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

  const salesResult = await Sale.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        totalUnitsSold: { $sum: '$unitsSold' },
        avgUnitsSold: { $avg: { $ifNull: ['$unitsSold', 0] } },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: { $ifNull: ['$totalCase', 0] } },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: { $ifNull: ['$totalValue', 0] } },
      },
    },
    {
      $sort: { totalUnitsSold: -1 },
    },
    {
      $project: {
        _id: 0,
        brandName: '$_id.brandName',
        sku: '$_id.sku',
        count: 1,
        totalUnitsSold: 1,
        avgUnitsSold: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
      },
    },
  ]);

  return salesResult;
};

const getAggregateSalesByStore = async (reqQuery) => {
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

  const salesResult = await Sale.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        totalUnitsSold: { $sum: '$unitsSold' },
        avgUnitsSold: { $avg: { $ifNull: ['$unitsSold', 0] } },
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
      $lookup: {
        from: 'employees',
        localField: 'initiativeStore.promoter',
        foreignField: '_id',
        as: 'promoter',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
              profilePicture: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$promoter',
    },
    {
      $sort: { totalUnitsSold: -1 },
    },
    {
      $project: {
        _id: 0,
        initiativeStoreId: '$_id.initiativeStore',
        count: 1,
        totalUnitsSold: 1,
        avgUnitsSold: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
        store: 1,
        promoter: 1,
      },
    },
  ]);

  return salesResult;
};

const getInitiativeSalesAnalytics = async (reqQuery) => {
  const { initiativeId, brandName, sku, target, durationInDays } = reqQuery;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const initiativeStores = await InitiativeStore.find({
    initiative: initiativeId,
    isDeleted: false,
  });

  const cumulativeTarget = initiativeStores.length * target;

  const salesResult = await Sale.aggregate([
    {
      $match: { initiative: new mongoose.Types.ObjectId(initiativeId), brandName, sku },
    },
    {
      $group: {
        _id: null,
        totalUnitsSold: { $sum: '$unitsSold' },
        avgUnitsSold: { $avg: '$unitsSold' },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: '$totalCase' },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: '$totalValue' },
      },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  if (!salesResult.length) {
    return {
      totalUnitsSold: 0,
      avgUnitsSold: 0,
      totalCase: 0,
      avgTotalCase: 0,
      totalValue: 0,
      avgTotalValue: 0,
      cumulativeTargetMetPercentage: 0,
      timeGonePercentage: 0,
      daysGone: 0,
      cumulativeTarget,
      brandName,
      sku,
      durationInDays: Number(durationInDays),
    };
  }

  const cumulativeTargetMetPercentage = (salesResult[0].totalUnitsSold / cumulativeTarget) * 100;
  let dateDiffInDays = 0;
  if (initiative.startDate && new Date(initiative.startDate) < new Date()) {
    dateDiffInDays = getDateDifferenceInDays(initiative.startDate, new Date());
  }
  const timeGonePercentage = (dateDiffInDays / Number(durationInDays)) * 100;

  return {
    ...salesResult[0],
    cumulativeTargetMetPercentage: parseFloat(cumulativeTargetMetPercentage.toFixed(2)),
    timeGonePercentage: parseFloat(timeGonePercentage.toFixed(2)),
    daysGone: dateDiffInDays,
    cumulativeTarget,
    brandName,
    sku,
    durationInDays: Number(durationInDays),
  };
};

const getInitiativeStoreSalesAnalytics = async (reqQuery) => {
  const { initiativeStoreId, brandName, sku, target, durationInDays } = reqQuery;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'startDate',
  });
  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  const salesResult = await Sale.aggregate([
    {
      $match: { initiativeStore: new mongoose.Types.ObjectId(initiativeStoreId), brandName, sku },
    },
    {
      $group: {
        _id: null,
        totalUnitsSold: { $sum: '$unitsSold' },
        avgUnitsSold: { $avg: '$unitsSold' },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: '$totalCase' },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: '$totalValue' },
      },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  if (!salesResult.length) {
    return {
      totalUnitsSold: 0,
      avgUnitsSold: 0,
      totalCase: 0,
      avgTotalCase: 0,
      totalValue: 0,
      avgTotalValue: 0,
      targetMetPercentage: 0,
      timeGonePercentage: 0,
      daysGone: 0,
      target: Number(target),
      brandName,
      sku,
      durationInDays: Number(durationInDays),
    };
  }

  const targetMetPercentage = (salesResult[0].totalUnitsSold / target) * 100;
  const { startDate } = initiativeStore.initiative;
  let dateDiffInDays = 0;
  if (startDate && new Date(startDate) < new Date()) {
    dateDiffInDays = getDateDifferenceInDays(startDate, new Date());
  }
  const timeGonePercentage = (dateDiffInDays / Number(durationInDays)) * 100;

  return {
    ...salesResult[0],
    targetMetPercentage: parseFloat(targetMetPercentage.toFixed(2)),
    timeGonePercentage: parseFloat(timeGonePercentage.toFixed(2)),
    daysGone: dateDiffInDays,
    target: Number(target),
    brandName,
    sku,
    durationInDays: Number(durationInDays),
  };
};

const getMonthlyAggregateSales = async (reqQuery) => {
  const { initiativeId, year, state } = reqQuery;

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const filterGroupingsResult = await processFilterGroupings(reqQuery);

  const filter = {
    initiative: new mongoose.Types.ObjectId(initiativeId),
    date: { $gte: startDate, $lte: endDate },
    ...filterGroupingsResult,
  };

  if (state) filter.state = state;

  const salesResult = await Sale.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: {
          month: { $month: { $dateFromString: { dateString: '$date' } } },
          year: { $year: { $dateFromString: { dateString: '$date' } } },
          brandName: '$brandName',
          sku: '$sku',
        },
        count: { $sum: 1 },
        totalUnitsSold: { $sum: '$unitsSold' },
        avgUnitsSold: { $avg: { $ifNull: ['$unitsSold', 0] } },
        totalCase: { $sum: '$totalCase' },
        avgTotalCase: { $avg: { $ifNull: ['$totalCase', 0] } },
        totalValue: { $sum: '$totalValue' },
        avgTotalValue: { $avg: { $ifNull: ['$totalValue', 0] } },
      },
    },
    {
      $sort: {
        '_id.month': 1,
        totalUnitsSold: -1,
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        year: '$_id.year',
        brandName: '$_id.brandName',
        sku: '$_id.sku',
        count: 1,
        totalUnitsSold: 1,
        avgUnitsSold: 1,
        totalCase: 1,
        avgTotalCase: 1,
        totalValue: 1,
        avgTotalValue: 1,
      },
    },
  ]);

  return salesResult;
};

const deleteSale = async (data) => {
  const { saleId, currentUser } = data;

  const sale = await Sale.findById(saleId).populate({ path: 'initiative', select: 'brands' });
  if (!sale) throw new httpError.NotFound('Sale not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && sale.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this sale');
  }

  const { brandName, sku } = sale;

  const brandDetails = sale.initiative?.brands.find(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!brandDetails) {
    throw new httpError.UnprocessableEntity(`${brandName}-${sku} details no longer available`);
  }

  const storeInventory = await StoreInventory.findOne({
    initiativeStore: sale.initiativeStore,
    brandName,
    sku,
  });

  if (!storeInventory) throw new httpError.NotFound('Store inventory document not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    storeInventory.availableStockQty += sale.unitsSold;
    storeInventory.totalCase = storeInventory.availableStockQty / brandDetails.caseUnitsNumber;
    storeInventory.totalValue = storeInventory.totalCase * brandDetails.pricePerCase;
    await storeInventory.save({ session });

    await Sale.deleteOne({ _id: saleId }, { session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

module.exports = {
  addSale,
  getAllSales,
  getSalesInExcel,
  getAggregateSales,
  getAggregateSalesByStore,
  getInitiativeSalesAnalytics,
  getInitiativeStoreSalesAnalytics,
  getMonthlyAggregateSales,
  deleteSale,
};
