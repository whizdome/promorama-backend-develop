const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const Order = require('../models/order.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addOrder = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;
  reqBody.date = reqBody.date.slice(0, 10);

  const { brandName, sku } = reqBody;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'orderBrands',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.orderBrands?.length) {
    throw new httpError.BadRequest('No order brands found on initiative');
  }

  const isValidBrand = initiativeStore.initiative.orderBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on order brands`);
  }

  const order = new Order({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...reqBody,
  });
  await order.save();

  return order;
};

const getOrders = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(Order.find(filter), reqQuery)
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

  const orders = await apiFeatures.query;
  const totalCount = await Order.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { orders, totalCount };
};

const getAggregateOrders = async (reqQuery) => {
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

  const ordersResult = await Order.aggregate([
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

  return ordersResult;
};

const getAggregateOrdersByStore = async (reqQuery) => {
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

  const ordersResult = await Order.aggregate([
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

  return ordersResult;
};

const getOrdersInExcel = async (reqQuery) => {
  const { startRange, endRange, initiative, ...queryString } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Order.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const orders = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return orders.map((order) => ({
    'Store Name': order.initiativeStore?.store?.name,
    LGA: order.initiativeStore?.store?.area,
    State: order.state,
    Date: order.date,
    Brand: order.brandName,
    SKU: order.sku,
    Value: order.value,
    Comment: order.comment,
    'Image URL': order.imageURL,
    Creator: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`,
    'Creator Role': order.user?.role,
  }));
};

const updateOrderDetails = async (data) => {
  const { orderId, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const { brandName, sku } = changes;

  const order = await Order.findById(orderId).populate({
    path: 'initiative',
    select: 'orderBrands',
  });

  if (!order) throw new httpError.NotFound('Order not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && order.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this order');
  }

  if (!order.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!order.initiative.orderBrands?.length) {
    throw new httpError.BadRequest('No order brands found on initiative');
  }

  const isValidBrand = order.initiative.orderBrands.some(
    (brand) => brand.name === brandName && brand.sku === sku,
  );

  if (!isValidBrand) {
    throw new httpError.BadRequest(`${brandName}-${sku} does not exist on order brands`);
  }

  await Order.updateOne({ _id: orderId }, changes);
};

const deleteOrder = async (data) => {
  const { orderId, currentUser } = data;

  const order = await Order.findById(orderId);
  if (!order) throw new httpError.NotFound('Order not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && order.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this order');
  }

  await Order.deleteOne({ _id: orderId });
};

module.exports = {
  addOrder,
  getOrders,
  getAggregateOrders,
  getAggregateOrdersByStore,
  getOrdersInExcel,
  updateOrderDetails,
  deleteOrder,
};
