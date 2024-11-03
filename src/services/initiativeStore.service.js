const httpError = require('http-errors');

const InitiativeStore = require('../models/initiativeStore.model');
const Initiative = require('../models/initiative.model');
const Store = require('../models/store.model');
const Employee = require('../models/employee.model');
const InAppNotification = require('../models/inAppNotification.model');
const PushNotification = require('../models/pushNotification.model');
const Attendance = require('../models/attendance.model');
const Competitor = require('../models/competitor.model');
const Inventory = require('../models/inventory.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const PriceCheck = require('../models/priceCheck.model');
const Sale = require('../models/sale.model');
const ShelfAndPosm = require('../models/shelfAndPosm.model');
const Shipment = require('../models/shipment.model');
const MustStockList = require('../models/mustStockList.model');
const ShareOfShelf = require('../models/shareOfShelf.model');

const { ROLE, INITIATIVE_STATUS, EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');

const APIFeatures = require('../utils/apiFeatures');
const { sendPushNotification } = require('../utils/pushNotification');
const socketIO = require('../helpers/socketIO');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const logger = require('../utils/customLogger');

const createInitiativeStore = async (data) => {
  const { initiativeId, currentUser, storeId, promoterId, supervisorId, radius } = data;

  const existingInitiativeStore = await InitiativeStore.findOne({
    initiative: initiativeId,
    store: storeId,
  });
  if (existingInitiativeStore) throw new httpError.BadRequest('Initiative store already exists');

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');
  if (initiative.isDeleted) throw new httpError.BadRequest('Initiative has been marked as deleted');

  if (currentUser.role === ROLE.CLIENT && currentUser.id !== initiative.client.toString()) {
    throw new httpError.Forbidden('You cannot create an initiative store for another client');
  }

  const store = await Store.findById(storeId);
  if (!store) throw new httpError.NotFound('Store not found');
  if (!store.isApproved) throw new httpError.BadRequest('Store not approved');
  if (store.isDeleted) throw new httpError.BadRequest('Store has been marked as deleted');

  const promoter = await Employee.findOne({ _id: promoterId, role: ROLE.PROMOTER });
  if (!promoter) throw new httpError.NotFound('Promoter not found');
  if (promoter.isDeleted) throw new httpError.BadRequest('Promoter has been marked as deleted');

  const supervisor = await Employee.findOne({ _id: supervisorId, role: ROLE.SUPERVISOR });
  if (!supervisor) throw new httpError.NotFound('Supervisor not found');
  if (supervisor.isDeleted) throw new httpError.BadRequest('Supervisor has been marked as deleted');

  const initiativeStore = await InitiativeStore.create({
    initiative: initiativeId,
    store: storeId,
    promoter: promoterId,
    supervisor: supervisorId,
    state: store.state,
    radius,
  });

  // Send notification to the promoter and supervisor
  const text = `You have been assigned to the store '${store.name}' for the '${initiative.name}' initiative`;
  const tokens = await PushNotification.getMultipleUsersDeviceTokens([promoterId, supervisorId]);
  if (tokens.length) {
    sendPushNotification({ title: 'Initiative Store Assigned', body: text, tokens });
  }

  InAppNotification.insertNotifications({
    userIDs: [promoterId, supervisorId],
    entityId: initiativeStore.id,
    type: 'Initiative Store',
    description: text,
  });
  socketIO.io.to([promoter.socketId, supervisor.socketId]).emit('newNotification', text);
};

const getInitiativeStores = async (initiativeId, reqQuery) => {
  const { gamePrizeName, ...queryString } = reqQuery;

  const filter = { initiative: initiativeId, isDeleted: false };
  if (gamePrizeName) filter['gamePrizes.name'] = gamePrizeName;

  const apiFeatures = new APIFeatures(InitiativeStore.find(filter), queryString)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({ path: 'initiative', select: '-isDeleted -deletedAt -updatedAt -__v' })
    .populate({
      path: 'store',
      select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
    })
    .populate({ path: 'promoter', select: 'firstName lastName email phoneNumber profilePicture' })
    .populate({
      path: 'supervisor',
      select: 'firstName lastName email phoneNumber profilePicture',
    });

  const initiativeStores = await apiFeatures.query;
  const totalCount = await InitiativeStore.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(queryString),
  });

  return { initiativeStores, totalCount };
};

const getInitiativeStoresInExcel = async (reqQuery) => {
  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(InitiativeStore.find({ isDeleted: false }), queryString)
    .filter()
    .sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const initiativeStores = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({ path: 'store', select: 'name phoneNumber state area town type' })
    .populate({ path: 'promoter', select: 'firstName lastName email phoneNumber profilePicture' })
    .populate({
      path: 'supervisor',
      select: 'firstName lastName email phoneNumber profilePicture',
    });

  return initiativeStores.map((initiativeStore) => ({
    Name: initiativeStore.store?.name,
    State: initiativeStore.store?.state,
    Area: initiativeStore.store?.area,
    Town: initiativeStore.store?.town,
    Promoter: `${initiativeStore.promoter?.firstName} ${initiativeStore.promoter?.lastName}`,
    Supervisor: `${initiativeStore.supervisor?.firstName} ${initiativeStore.supervisor?.lastName}`,
  }));
};

const getAssignedInitiativeStores = (currentUser, reqQuery) => {
  let filter = { promoter: currentUser.id };
  if (currentUser.role === ROLE.SUPERVISOR) filter = { supervisor: currentUser.id };
  filter.isDeleted = false;

  const apiFeatures = new APIFeatures(InitiativeStore.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({ path: 'initiative', select: '-isDeleted -deletedAt -updatedAt -__v' })
    .populate({
      path: 'store',
      select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
    });

  return apiFeatures.query;
};

const getInitiativeStoreDetails = (initiativeStoreId) => {
  return InitiativeStore.findById(initiativeStoreId)
    .populate({ path: 'initiative', select: '-isDeleted -deletedAt -updatedAt -__v' })
    .populate({
      path: 'store',
      select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
    })
    .populate({ path: 'promoter', select: 'firstName lastName email phoneNumber profilePicture' })
    .populate({
      path: 'supervisor',
      select: 'firstName lastName email phoneNumber profilePicture',
    });
};

const getInitiativeStoresWithNoSubmission = async (data) => {
  const { initiativeId, date, resourceType, ...reqQuery } = data;

  const resourceModelMap = {
    attendance: Attendance,
    competitor: Competitor,
    inventory: Inventory,
    order: Order,
    payment: Payment,
    priceCheck: PriceCheck,
    sale: Sale,
    shelfAndPosm: ShelfAndPosm,
    shipment: Shipment,
    msl: MustStockList,
    sos: ShareOfShelf,
  };

  const ResourceModel = resourceModelMap[resourceType];
  if (!ResourceModel) throw new httpError.BadRequest('Invalid resource type');

  const resourceFilter = { initiative: initiativeId, date };
  if (resourceType === 'attendance' || resourceType === 'shelfAndPosm') {
    const dateObject = new Date(date);
    dateObject.setHours(0, 0, 0, 0);
    const startDate = dateObject.toISOString();
    dateObject.setHours(23, 59, 59, 999);
    const endDate = dateObject.toISOString();

    resourceFilter.createdAt = { $gte: startDate, $lte: endDate };
    delete resourceFilter.date;
  }

  const initiativeStoresIDs = await ResourceModel.find(resourceFilter).distinct('initiativeStore');

  const filter = { _id: { $nin: initiativeStoresIDs }, initiative: initiativeId, isDeleted: false };
  const apiFeatures = new APIFeatures(InitiativeStore.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'store',
      select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
    })
    .populate({ path: 'promoter', select: 'firstName lastName email phoneNumber profilePicture' })
    .populate({
      path: 'supervisor',
      select: 'firstName lastName email phoneNumber profilePicture',
    });

  const initiativeStores = await apiFeatures.query;
  const totalCount = await InitiativeStore.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { initiativeStores, totalCount };
};

const getInitiativeStoresWithNoSubmissionInExcel = async (reqQuery) => {
  const { initiativeId, date, resourceType, startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const resourceModelMap = {
    attendance: Attendance,
    competitor: Competitor,
    inventory: Inventory,
    order: Order,
    payment: Payment,
    priceCheck: PriceCheck,
    sale: Sale,
    shelfAndPosm: ShelfAndPosm,
    shipment: Shipment,
    msl: MustStockList,
    sos: ShareOfShelf,
  };

  const ResourceModel = resourceModelMap[resourceType];
  if (!ResourceModel) throw new httpError.BadRequest('Invalid resource type');

  const resourceFilter = { initiative: initiativeId, date };
  if (resourceType === 'attendance' || resourceType === 'shelfAndPosm') {
    const dateObject = new Date(date);
    dateObject.setHours(0, 0, 0, 0);
    const startDate = dateObject.toISOString();
    dateObject.setHours(23, 59, 59, 999);
    const endDate = dateObject.toISOString();

    resourceFilter.createdAt = { $gte: startDate, $lte: endDate };
    delete resourceFilter.date;
  }

  const initiativeStoresIDs = await ResourceModel.find(resourceFilter).distinct('initiativeStore');

  const filter = { _id: { $nin: initiativeStoresIDs }, initiative: initiativeId, isDeleted: false };
  const apiFeatures = new APIFeatures(InitiativeStore.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const initiativeStores = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({ path: 'store', select: 'name phoneNumber state area town type' })
    .populate({ path: 'promoter', select: 'firstName lastName email phoneNumber profilePicture' })
    .populate({
      path: 'supervisor',
      select: 'firstName lastName email phoneNumber profilePicture',
    });

  return initiativeStores.map((initiativeStore) => ({
    Name: initiativeStore.store?.name,
    State: initiativeStore.store?.state,
    Area: initiativeStore.store?.area,
    Town: initiativeStore.store?.town,
    Promoter: `${initiativeStore.promoter?.firstName} ${initiativeStore.promoter?.lastName}`,
    Supervisor: `${initiativeStore.supervisor?.firstName} ${initiativeStore.supervisor?.lastName}`,
  }));
};

const updateInitiativeStore = async (data) => {
  const { initiativeStoreId, promoterId, supervisorId, radius } = data;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId)
    .populate({ path: 'initiative', select: 'name' })
    .populate({ path: 'store', select: 'name' });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  let promoter;
  if (promoterId) {
    promoter = await Employee.findOne({ _id: promoterId, role: ROLE.PROMOTER });
    if (!promoter) throw new httpError.NotFound('Promoter not found');
    if (promoter.isDeleted) throw new httpError.BadRequest('Promoter has been marked as deleted');
  }

  let supervisor;
  if (supervisorId) {
    supervisor = await Employee.findOne({ _id: supervisorId, role: ROLE.SUPERVISOR });
    if (!supervisor) throw new httpError.NotFound('Supervisor not found');
    if (supervisor.isDeleted) {
      throw new httpError.BadRequest('Supervisor has been marked as deleted');
    }
  }

  initiativeStore.promoter = promoterId || initiativeStore.promoter;
  initiativeStore.supervisor = supervisorId || initiativeStore.supervisor;
  initiativeStore.radius = radius || initiativeStore.radius;
  await initiativeStore.save();

  // Send notification to the promoter and/or supervisor
  const text = `You have been assigned to the store '${initiativeStore.store.name}' for the '${initiativeStore.initiative.name}' initiative`;
  if (promoterId) {
    const tokens = await PushNotification.getUserDeviceTokens(promoterId);
    if (tokens.length) {
      sendPushNotification({ title: 'Initiative Store Assigned', body: text, tokens });
    }

    InAppNotification.insertNotification({
      userId: promoterId,
      entityId: initiativeStore.id,
      type: 'Initiative Store',
      description: text,
    });
    socketIO.io.to(promoter.socketId).emit('newNotification', text);
  }

  if (supervisorId) {
    const tokens = await PushNotification.getUserDeviceTokens(supervisorId);
    if (tokens.length) {
      sendPushNotification({ title: 'Initiative Store Assigned', body: text, tokens });
    }

    InAppNotification.insertNotification({
      userId: supervisorId,
      entityId: initiativeStore.id,
      type: 'Initiative Store',
      description: text,
    });
    socketIO.io.to(supervisor.socketId).emit('newNotification', text);
  }
};

const deleteInitiativeStore = async (data) => {
  const { initiativeStoreId, currentUser } = data;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId);
  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  const initiative = await Initiative.findById(initiativeStore.initiative);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  return initiativeStore.deleteOne();
};

const softDeleteInitiativeStore = (initiativeStoreId) => {
  return InitiativeStore.findByIdAndUpdate(
    initiativeStoreId,
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true },
  );
};

const restoreInitiativeStore = (initiativeStoreId) => {
  return InitiativeStore.findByIdAndUpdate(
    initiativeStoreId,
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true },
  );
};

const addGamePrize = async (data) => {
  const { initiativeStoreId, gamePrizeData } = data;

  const { name, rank } = gamePrizeData;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'gamePrizeOptions',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.gamePrizeOptions?.length) {
    throw new httpError.BadRequest('No game prize options found on initiative');
  }

  const isValidGamePrizeOption = initiativeStore.initiative.gamePrizeOptions.some(
    (option) => option.name === name.toLowerCase().trim() && option.rank === rank,
  );

  if (!isValidGamePrizeOption) {
    throw new httpError.BadRequest(
      `${name} with the rank of ${rank} does not exist on initiative game prize options`,
    );
  }

  const existingGamePrize = await InitiativeStore.findOne({
    _id: initiativeStoreId,
    'gamePrizes.name': gamePrizeData.name,
  });

  if (existingGamePrize) throw new httpError.BadRequest('Game prize already exists');

  await InitiativeStore.updateOne(
    { _id: initiativeStoreId },
    {
      $push: { gamePrizes: gamePrizeData },
    },
  );
};

const updateGamePrizeDetails = async (data) => {
  const { initiativeStoreId, gamePrizeId, gamePrizeData } = data;

  const { name, rank } = gamePrizeData;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId).populate({
    path: 'initiative',
    select: 'gamePrizeOptions',
  });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  if (!initiativeStore.initiative) {
    throw new httpError.UnprocessableEntity('Initiative details could not be retrieved');
  }

  if (!initiativeStore.initiative.gamePrizeOptions?.length) {
    throw new httpError.BadRequest('No game prize options found on initiative');
  }

  const isValidGamePrizeOption = initiativeStore.initiative.gamePrizeOptions.some(
    (option) => option.name === name.toLowerCase().trim() && option.rank === rank,
  );

  if (!isValidGamePrizeOption) {
    throw new httpError.BadRequest(
      `${name} with the rank of ${rank} does not exist on initiative game prize options`,
    );
  }

  const doc = await InitiativeStore.findOne(
    { _id: initiativeStoreId, 'gamePrizes.name': gamePrizeData.name },
    { 'gamePrizes.$': 1 },
  );

  if (doc && doc.gamePrizes[0]._id.toString() !== gamePrizeId) {
    throw new httpError.BadRequest(`Game prize already exists`);
  }

  const updatedInitiativeStore = await InitiativeStore.findOneAndUpdate(
    { _id: initiativeStore, 'gamePrizes._id': gamePrizeId },
    {
      $set: {
        'gamePrizes.$.name': gamePrizeData.name,
        'gamePrizes.$.quantityAvailable': gamePrizeData.quantityAvailable,
        'gamePrizes.$.rank': gamePrizeData.rank,
      },
    },
  );

  if (!updatedInitiativeStore) throw new httpError.NotFound('Game prize not found');
};

const deleteGamePrize = async (data) => {
  const { initiativeStoreId, gamePrizeId } = data;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId);
  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');

  const updatedInitiativeStore = await InitiativeStore.findOneAndUpdate(
    { _id: initiativeStoreId, 'gamePrizes._id': gamePrizeId },
    {
      $pull: { gamePrizes: { _id: gamePrizeId } },
    },
  );

  if (!updatedInitiativeStore) throw new httpError.NotFound('Game prize not found');
};

const addGamePrizeToInitiativeStores = async (data) => {
  const { initiativeId, name, rank, entries } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const isValidGamePrizeOption = initiative.gamePrizeOptions.some(
    (option) => option.name === name.toLowerCase().trim() && option.rank === rank,
  );

  if (!isValidGamePrizeOption) {
    throw new httpError.BadRequest(
      `${name} with the rank of ${rank} does not exist on initiative game prize options`,
    );
  }

  const promises = entries.map(async (entry) => {
    try {
      const { initiativeStoreId, quantity } = entry;

      const initiativeStore = await InitiativeStore.findById(initiativeStoreId);

      if (initiativeStore) {
        const existingGamePrize = await InitiativeStore.findOne({
          _id: initiativeStoreId,
          'gamePrizes.name': name,
        });

        if (!existingGamePrize) {
          await InitiativeStore.updateOne(
            { _id: initiativeStoreId },
            {
              $push: { gamePrizes: { name, rank, quantityAvailable: quantity } },
            },
          );
        } else {
          await InitiativeStore.updateOne(
            { _id: initiativeStore, 'gamePrizes.name': name },
            {
              $set: { 'gamePrizes.$.name': name, 'gamePrizes.$.rank': rank },
              $inc: { 'gamePrizes.$.quantityAvailable': quantity },
            },
          );
        }
      } else {
        logger.info(
          `[AddGamePrizeToInitiativeStores]: Initiative store with the id ${initiativeStoreId} not found`,
        );
      }
    } catch (error) {
      logger.error(`AddGamePrizeToInitiativeStores]: ${error.message}`);
    }
  });

  await Promise.allSettled(promises);
};

module.exports = {
  createInitiativeStore,
  getInitiativeStores,
  getInitiativeStoresInExcel,
  getAssignedInitiativeStores,
  getInitiativeStoreDetails,
  getInitiativeStoresWithNoSubmission,
  getInitiativeStoresWithNoSubmissionInExcel,
  updateInitiativeStore,
  deleteInitiativeStore,
  softDeleteInitiativeStore,
  restoreInitiativeStore,
  addGamePrize,
  updateGamePrizeDetails,
  deleteGamePrize,
  addGamePrizeToInitiativeStores,
};
