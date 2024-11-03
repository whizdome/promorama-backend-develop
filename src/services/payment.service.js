const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const Payment = require('../models/payment.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addPayment = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { brandName, sku } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'paymentBrands',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.paymentBrands?.length) {
    throw new httpError.BadRequest('No payment brands found on initiative');
  }

  const isValidBrand = initiativeStore.initiative.paymentBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on payment brands`);
  }

  const payment = new Payment({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
  });
  await payment.save();

  return payment;
};

const getPayments = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(Payment.find(filter), reqQuery)
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

  const payments = await apiFeatures.query;
  const totalCount = await Payment.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { payments, totalCount };
};

const getAggregatePayments = async (reqQuery) => {
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

  const paymentsResult = await Payment.aggregate([
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

  return paymentsResult;
};

const getAggregatePaymentsByStore = async (reqQuery) => {
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

  const paymentsResult = await Payment.aggregate([
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

  return paymentsResult;
};

const getPaymentsInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Payment.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const payments = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return payments.map((payment) => ({
    'Store Name': payment.initiativeStore?.store?.name,
    LGA: payment.initiativeStore?.store?.area,
    State: payment.state,
    Date: payment.date,
    Brand: payment.brandName,
    SKU: payment.sku,
    Value: payment.value,
    Comment: payment.comment,
    'Image URL': payment.imageURL,
    Creator: `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`,
    'Creator Role': payment.user?.role,
  }));
};

const updatePaymentDetails = async (data) => {
  const { paymentId, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const { brandName, sku } = changes;

  const payment = await Payment.findById(paymentId).populate({
    path: 'initiative',
    select: 'paymentBrands',
  });

  if (!payment) throw new httpError.NotFound('Payment not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && payment.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this payment');
  }

  if (!payment.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!payment.initiative.paymentBrands?.length) {
    throw new httpError.BadRequest('No payment brands found on initiative');
  }

  const isValidBrand = payment.initiative.paymentBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on payment brands`);
  }

  await Payment.updateOne({ _id: paymentId }, changes);
};

const deletePayment = async (data) => {
  const { paymentId, currentUser } = data;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new httpError.NotFound('Payment not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && payment.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this payment');
  }

  await Payment.deleteOne({ _id: paymentId });
};

module.exports = {
  addPayment,
  getPayments,
  getAggregatePayments,
  getAggregatePaymentsByStore,
  getPaymentsInExcel,
  updatePaymentDetails,
  deletePayment,
};
