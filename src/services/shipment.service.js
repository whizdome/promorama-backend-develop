const httpError = require('http-errors');
const mongoose = require('mongoose');
const Joi = require('joi');

const InitiativeStore = require('../models/initiativeStore.model');
const Shipment = require('../models/shipment.model');
const StoreInventory = require('../models/storeInventory.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { parseCsv } = require('../utils/parseCsv');
const logger = require('../utils/customLogger');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addShipment = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { date, brandName, sku, totalCase } = reqBody;

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

  const existingShipmentRecord = await Shipment.findOne({
    initiativeStore: initiativeStoreId,
    date,
    brandName,
    sku,
  });

  if (existingShipmentRecord) {
    throw new httpError.BadRequest(`The shipment has already been recorded`);
  }

  const existingStoreInventory = await StoreInventory.findOne({
    initiativeStore: initiativeStoreId,
    brandName,
    sku,
  });

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { caseUnitsNumber, pricePerCase } = existingBrand;

    const unitsShipped = totalCase * caseUnitsNumber;
    const totalValue = totalCase * pricePerCase;

    const shipment = new Shipment({
      initiative: initiativeStore.initiative,
      initiativeStore: initiativeStoreId,
      user: currentUser.id,
      userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
      ...reqBody,
      unitsShipped,
      totalValue,
    });
    await shipment.save({ session });

    if (existingStoreInventory) {
      existingStoreInventory.availableStockQty += shipment.unitsShipped;
      existingStoreInventory.totalCase = existingStoreInventory.availableStockQty / caseUnitsNumber;
      existingStoreInventory.totalValue = existingStoreInventory.totalCase * pricePerCase;
      await existingStoreInventory.save({ session });
    } else {
      const storeInventory = new StoreInventory({
        initiative: shipment.initiative,
        initiativeStore: shipment.initiativeStore,
        brandName: shipment.brandName,
        sku: shipment.sku,
        availableStockQty: shipment.unitsShipped,
        state: shipment.state,
        totalCase: shipment.totalCase,
        totalValue: shipment.totalValue,
      });
      await storeInventory.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return shipment;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const addShipmentsViaUpload = async (data) => {
  const { initiativeStoreId, currentUser, file } = data;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'store',
    select: 'state',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  const options = {
    headers: ['brandName', 'sku', 'caseUnitsNumber', 'pricePerCase', 'totalCase', 'date'],
    renameHeaders: true,
  };

  const validateRow = (row) => {
    const { error } = Joi.object({
      brandName: Joi.string().required(),
      sku: Joi.string().required(),
      caseUnitsNumber: Joi.number().options({ convert: false }).required(),
      pricePerCase: Joi.number().options({ convert: false }).required(),
      totalCase: Joi.number().options({ convert: false }).required(),
      date: Joi.date().iso().required(),
    }).validate(row);

    return !error; // Return true if validation passes, false otherwise
  };

  const transformRow = (row) => ({
    brandName: row.brandName,
    sku: row.sku,
    caseUnitsNumber: Number(row.caseUnitsNumber),
    pricePerCase: Number(row.pricePerCase),
    totalCase: Number(row.totalCase),
    date: row.date,
  });

  const parsedData = await parseCsv(file.buffer, options, validateRow, transformRow);

  const promises = parsedData.map(async (shipmentData) => {
    try {
      const { brandName, sku, caseUnitsNumber, pricePerCase, totalCase, date } = shipmentData;

      const existingShipmentRecord = await Shipment.findOne({
        initiativeStore: initiativeStoreId,
        date,
        brandName,
        sku,
      });

      if (existingShipmentRecord) {
        logger.info(`Shipment already processed: ${JSON.stringify(shipmentData)}`);
      }

      const existingStoreInventory = await StoreInventory.findOne({
        initiativeStore: initiativeStoreId,
        brandName,
        sku,
      });

      if (!existingShipmentRecord) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const unitsShipped = totalCase * caseUnitsNumber;
          const totalValue = totalCase * pricePerCase;

          const shipment = new Shipment({
            initiative: initiativeStore.initiative,
            initiativeStore: initiativeStoreId,
            user: currentUser.id,
            userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
            ...shipmentData,
            unitsShipped,
            totalValue,
            state: initiativeStore.state || initiativeStore.store?.state,
          });
          await shipment.save({ session });

          if (existingStoreInventory) {
            existingStoreInventory.availableStockQty += shipment.unitsShipped;
            existingStoreInventory.totalCase =
              existingStoreInventory.availableStockQty / caseUnitsNumber;
            existingStoreInventory.totalValue = existingStoreInventory.totalCase * pricePerCase;
            await existingStoreInventory.save({ session });
          } else {
            const storeInventory = new StoreInventory({
              initiative: shipment.initiative,
              initiativeStore: shipment.initiativeStore,
              brandName: shipment.brandName,
              sku: shipment.sku,
              availableStockQty: shipment.unitsShipped,
              state: shipment.state,
              totalCase: shipment.totalCase,
              totalValue: shipment.totalValue,
            });
            await storeInventory.save({ session });
          }

          await session.commitTransaction();
        } catch (err) {
          await session.abortTransaction();
          throw err; // Rethrow the error to be caught in the outer catch
        } finally {
          session.endSession();
        }
      }
    } catch (error) {
      logger.error(
        `[AddShipmentsViaUpload]: Error processing shipment for product ${shipmentData.brandName}-${shipmentData.sku}: ${error.message}`,
      );
    }
  });

  await Promise.allSettled(promises).catch((error) => {
    logger.error(`[AddShipmentsViaUpload]: ${error.message}`);
  });
};

const getShipments = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(Shipment.find(filter), reqQuery)
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

  const shipments = await apiFeatures.query;
  const totalCount = await Shipment.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { shipments, totalCount };
};

const getAggregateShipments = async (reqQuery) => {
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

  const shipmentsResult = await Shipment.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { brandName: '$brandName', sku: '$sku' },
        count: { $sum: 1 },
        total: { $sum: '$unitsShipped' },
        avg: { $avg: { $ifNull: ['$unitsShipped', 0] } },
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

  return shipmentsResult;
};

const getAggregateShipmentsByStore = async (reqQuery) => {
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

  const shipmentsResult = await Shipment.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: { initiativeStore: '$initiativeStore' },
        count: { $sum: 1 },
        total: { $sum: '$unitsShipped' },
        avg: { $avg: { $ifNull: ['$unitsShipped', 0] } },
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

  return shipmentsResult;
};

const getShipmentsInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Shipment.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const shipments = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return shipments.map((shipment) => ({
    'Store Name': shipment.initiativeStore?.store?.name,
    LGA: shipment.initiativeStore?.store?.area,
    State: shipment.state,
    Date: shipment.date,
    Brand: shipment.brandName,
    SKU: shipment.sku,
    'Units Shipped': shipment.unitsShipped,
    'Total Case': shipment.totalCase,
    'Total Value': shipment.totalValue,
    Comment: shipment.comment,
    'Image URL': shipment.imageURL,
    Creator: `${shipment.user?.firstName || ''} ${shipment.user?.lastName || ''}`,
    'Creator Role': shipment.user?.role,
  }));
};

const deleteShipment = async (data) => {
  const { shipmentId, currentUser } = data;

  const shipment = await Shipment.findById(shipmentId).populate({
    path: 'initiative',
    select: 'brands',
  });

  if (!shipment) throw new httpError.NotFound('Shipment not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && shipment.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this shipment');
  }

  const { brandName, sku } = shipment;

  const brandDetails = shipment.initiative?.brands.find(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!brandDetails) {
    throw new httpError.UnprocessableEntity(`${brandName}-${sku} details no longer available`);
  }

  const storeInventory = await StoreInventory.findOne({
    initiativeStore: shipment.initiativeStore,
    brandName,
    sku,
  });

  if (!storeInventory) throw new httpError.NotFound('Store inventory document not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    storeInventory.availableStockQty -= shipment.unitsShipped;
    storeInventory.totalCase = storeInventory.availableStockQty / brandDetails.caseUnitsNumber;
    storeInventory.totalValue = storeInventory.totalCase * brandDetails.pricePerCase;
    await storeInventory.save({ session });

    await Shipment.deleteOne({ _id: shipmentId }, { session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

module.exports = {
  addShipment,
  addShipmentsViaUpload,
  getShipments,
  getAggregateShipments,
  getAggregateShipmentsByStore,
  getShipmentsInExcel,
  deleteShipment,
};
