const httpError = require('http-errors');
const { startSession } = require('mongoose');

const Client = require('../models/client.model');
const Initiative = require('../models/initiative.model');
const InitiativeStore = require('../models/initiativeStore.model');
const Agency = require('../models/agency.model');

const APIFeatures = require('../utils/apiFeatures');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const { ROLE, INITIATIVE_STATUS } = require('../helpers/constants');

const createInitiative = async (data) => {
  const { clientId, agencyId } = data;

  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');
  if (!client.isApproved) throw new httpError.BadRequest('Client not approved');
  if (client.isDeleted) throw new httpError.BadRequest('Client has been marked as deleted');

  if (agencyId) {
    const agency = await Agency.findById(agencyId);
    if (!agency) throw new httpError.NotFound('Agency not found');
    if (agency.isDeleted) throw new httpError.BadRequest('Agency has been marked as deleted');
  }

  return Initiative.create({ client: client._id, agency: agencyId, ...data });
};

const addBrand = async (data) => {
  const { initiativeId, brandData, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  initiative.brands.push(brandData);
  return initiative.save();
};

const updateBrandDetails = async (data) => {
  const { initiativeId, brandId, brandData, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  return Initiative.findOneAndUpdate(
    { _id: initiativeId, 'brands._id': brandId },
    {
      $set: {
        'brands.$.name': brandData.name,
        'brands.$.sku': brandData.sku,
        'brands.$.image': brandData.image,
        'brands.$.target': brandData.target,
        'brands.$.durationInDays': brandData.durationInDays,
        'brands.$.caseUnitsNumber': brandData.caseUnitsNumber,
        'brands.$.pricePerCase': brandData.pricePerCase,
      },
    },
    { new: true },
  );
};

const deleteBrand = async (data) => {
  const { initiativeId, brandId, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  initiative.brands.pull(brandId);
  return initiative.save();
};

const addShelfAndPosmImages = async (data) => {
  const { initiativeId, currentUser, shelfImages, posmImages } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  return Initiative.findByIdAndUpdate(
    initiativeId,
    { $set: { shelfImages, posmImages } },
    { new: true },
  );
};

const getAllInitiatives = async (currentUser, reqQuery) => {
  const filter = { isDeleted: false };
  if (currentUser.role === ROLE.CLIENT) filter.client = currentUser.id;
  if (currentUser.role === ROLE.AGENCY) filter.agency = currentUser.id;
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { description: { $regex: sanitizedTerm, $options: 'i' } },
      { instructions: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Initiative.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'client',
      select: 'companyName email phoneNumber profilePicture statesFilterGroups',
    })
    .populate({
      path: 'agency',
      select: 'name email phoneNumber profilePicture',
    });

  const initiatives = await apiFeatures.query;
  const totalCount = await Initiative.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { initiatives, totalCount };
};

const getInitiativeDetails = (initiativeId) => {
  return Initiative.findById(initiativeId)
    .populate({
      path: 'client',
      select: 'companyName email phoneNumber profilePicture statesFilterGroups',
    })
    .populate({
      path: 'agency',
      select: 'name email phoneNumber profilePicture',
    });
};

const updateInitiativeDetails = async (data) => {
  const { initiativeId, changes, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  return Initiative.findByIdAndUpdate(initiativeId, changes, { new: true });
};

const changeInitiativeStatus = async (data) => {
  const { initiativeId, changes, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const date = changes.date?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  if (currentUser.role !== ROLE.SUPER_ADMIN && changes.status === INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest(
      'You are not allowed to change the initiative status to pending',
    );
  }

  if (
    currentUser.role !== ROLE.SUPER_ADMIN &&
    initiative.status === INITIATIVE_STATUS.COMPLETED &&
    changes.status === INITIATIVE_STATUS.ONGOING
  ) {
    throw new httpError.BadRequest(
      'You are not allowed to change the initiative status from completed to ongoing',
    );
  }

  if (
    initiative.status === INITIATIVE_STATUS.PENDING &&
    changes.status === INITIATIVE_STATUS.COMPLETED
  ) {
    throw new httpError.BadRequest('The initiative has not started');
  }

  if (
    initiative.status === INITIATIVE_STATUS.COMPLETED &&
    changes.status === INITIATIVE_STATUS.PENDING
  ) {
    throw new httpError.BadRequest('The initiative has to be ongoing to change it back to pending');
  }

  initiative.status = changes.status;
  if (changes.status === INITIATIVE_STATUS.PENDING) {
    initiative.startDate = null;
    initiative.endDate = null;
  }
  if (changes.status === INITIATIVE_STATUS.ONGOING) {
    initiative.startDate = date;
    initiative.endDate = null;
  }
  if (changes.status === INITIATIVE_STATUS.COMPLETED) {
    initiative.endDate = date;
  }

  return initiative.save();
};

const deleteInitiative = async (data) => {
  const { initiativeId, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  return initiative.deleteOne();
};

const softDeleteInitiative = async (data) => {
  const { initiativeId, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  const session = await startSession();
  try {
    session.startTransaction();

    initiative.isDeleted = true;
    initiative.deletedAt = new Date();
    await initiative.save({ session });

    await InitiativeStore.updateMany(
      { initiative: initiative._id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), isBulkDeleted: true } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const restoreInitiative = async (data) => {
  const { initiativeId, currentUser } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && initiative.status !== INITIATIVE_STATUS.PENDING) {
    throw new httpError.BadRequest('The initiative status is no longer pending');
  }

  const session = await startSession();
  try {
    session.startTransaction();

    initiative.isDeleted = false;
    initiative.deletedAt = null;
    await initiative.save({ session });

    await InitiativeStore.updateMany(
      { initiative: initiative._id, isBulkDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, isBulkDeleted: false } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw err;
  }
};

const addGame = async (data) => {
  const { initiativeId, gameData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const existingGame = await Initiative.findOne({ _id: initiativeId, 'games.name': gameData.name });
  if (existingGame) throw new httpError.BadRequest(`Game already exists`);

  initiative.games.push(gameData);
  return initiative.save();
};

const updateGameDetails = async (data) => {
  const { initiativeId, gameId, gameData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  // const doc = await Initiative.findOne(
  //   { _id: initiativeId, 'games.name': gameData.name },
  //   { 'games.$': 1 },
  // );

  // if (doc && doc.games[0]._id.toString() !== gameId) {
  //   throw new httpError.BadRequest(`Game already exists`);
  // }

  return Initiative.findOneAndUpdate(
    { _id: initiativeId, 'games._id': gameId },
    {
      $set: {
        'games.$.title': gameData.title,
        'games.$.imageURL': gameData.imageURL,
        'games.$.questions': gameData.questions,
      },
    },
    { new: true },
  );
};

const deleteGame = async (data) => {
  const { initiativeId, gameId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.games.pull(gameId);
  return initiative.save();
};

const addGamePrizeOption = async (data) => {
  const { initiativeId, gamePrizeOptionData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const existingGamePrizeOption = await Initiative.findOne({
    _id: initiativeId,
    'gamePrizeOptions.name': gamePrizeOptionData.name,
  });

  if (existingGamePrizeOption) throw new httpError.BadRequest('Game prize option already exists');

  initiative.gamePrizeOptions.push(gamePrizeOptionData);
  await initiative.save();

  return initiative;
};

const updateGamePrizeOption = async (data) => {
  const { initiativeId, gamePrizeOptionId, gamePrizeOptionData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const doc = await Initiative.findOne(
    { _id: initiativeId, 'gamePrizeOptions.name': gamePrizeOptionData.name },
    { 'gamePrizeOptions.$': 1 },
  );

  if (doc && doc.gamePrizeOptions[0]._id.toString() !== gamePrizeOptionId) {
    throw new httpError.BadRequest('Game prize option already exists');
  }

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'gamePrizeOptions._id': gamePrizeOptionId },
    {
      $set: {
        'gamePrizeOptions.$.name': gamePrizeOptionData.name,
        'gamePrizeOptions.$.rank': gamePrizeOptionData.rank,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Game prize option not found');

  return updatedInitiative;
};

const deleteGamePrizeOption = async (data) => {
  const { initiativeId, gamePrizeOptionId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'gamePrizeOptions._id': gamePrizeOptionId },
    {
      $pull: { gamePrizeOptions: { _id: gamePrizeOptionId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Game prize option not found');

  return updatedInitiative;
};

const assignAgency = async (data) => {
  const { initiativeId, agencyId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const agency = await Agency.findById(agencyId);
  if (!agency) throw new httpError.NotFound('Agency not found');
  if (agency.isDeleted) throw new httpError.BadRequest('Agency has been marked as deleted');

  initiative.agency = agency._id;
  await initiative.save();

  return initiative;
};

const unassignAgency = async (initiativeId) => {
  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.agency = null;
  await initiative.save();

  return initiative;
};

const addCompetitorBrand = async (data) => {
  const { initiativeId, competitorBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.competitorBrands.push(competitorBrandData);
  await initiative.save();

  return initiative;
};

const updateCompetitorBrand = async (data) => {
  const { initiativeId, brandId, competitorBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'competitorBrands._id': brandId },
    {
      $set: {
        'competitorBrands.$.name': competitorBrandData.name,
        'competitorBrands.$.sku': competitorBrandData.sku,
        'competitorBrands.$.imageURL': competitorBrandData.imageURL,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Competitor brand not found');

  return updatedInitiative;
};

const deleteCompetitorBrand = async (data) => {
  const { initiativeId, brandId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'competitorBrands._id': brandId },
    {
      $pull: { competitorBrands: { _id: brandId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Competitor brand not found');

  return updatedInitiative;
};

const addInitiativeStoresFilterGroup = async (data) => {
  const { initiativeId, reqBody } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.initiativeStoresFilterGroups.push(reqBody);
  await initiative.save();
};

const getInitiativeStoresFilterGroup = async (data) => {
  const { initiativeId, groupId } = data;

  const groupSubDoc = await Initiative.findOne(
    { _id: initiativeId, 'initiativeStoresFilterGroups._id': groupId },
    { 'initiativeStoresFilterGroups.$': 1 },
  );

  if (!groupSubDoc) throw new httpError.NotFound('Initiative stores filter group not found');

  const initiativeStores = InitiativeStore.find(
    {
      _id: { $in: groupSubDoc.initiativeStoresFilterGroups[0].initiativeStoresIDs },
    },
    { store: 1 },
  ).populate({
    path: 'store',
    select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
  });

  return initiativeStores;
};

const updateInitiativeStoresFilterGroup = async (data) => {
  const { initiativeId, groupId, changes } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'initiativeStoresFilterGroups._id': groupId },
    {
      $set: {
        'initiativeStoresFilterGroups.$.name': changes.name,
        'initiativeStoresFilterGroups.$.initiativeStoresIDs': changes.initiativeStoresIDs,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Initiative stores filter group not found');
};

const deleteInitiativeStoresFilterGroup = async (data) => {
  const { initiativeId, groupId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'initiativeStoresFilterGroups._id': groupId },
    {
      $pull: { initiativeStoresFilterGroups: { _id: groupId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Initiative stores filter group not found');
};

const addProductsFilterGroup = async (data) => {
  const { initiativeId, reqBody } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.productsFilterGroups.push(reqBody);
  await initiative.save();
};

const updateProductsFilterGroup = async (data) => {
  const { initiativeId, groupId, changes } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'productsFilterGroups._id': groupId },
    {
      $set: {
        'productsFilterGroups.$.name': changes.name,
        'productsFilterGroups.$.products': changes.products,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Products filter group not found');
};

const deleteProductsFilterGroup = async (data) => {
  const { initiativeId, groupId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'productsFilterGroups._id': groupId },
    {
      $pull: { productsFilterGroups: { _id: groupId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Products filter group not found');
};

const addMSLBrand = async (data) => {
  const { initiativeId, mslBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.mslBrands.push(mslBrandData);
  await initiative.save();

  return initiative;
};

const updateMSLBrand = async (data) => {
  const { initiativeId, brandId, mslBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'mslBrands._id': brandId },
    {
      $set: {
        'mslBrands.$.name': mslBrandData.name,
        'mslBrands.$.sku': mslBrandData.sku,
        'mslBrands.$.imageURL': mslBrandData.imageURL,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('MSL brand not found');

  return updatedInitiative;
};

const deleteMSLBrand = async (data) => {
  const { initiativeId, brandId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'mslBrands._id': brandId },
    {
      $pull: { mslBrands: { _id: brandId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('MSL brand not found');

  return updatedInitiative;
};

const addSOSBrand = async (data) => {
  const { initiativeId, sosBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.sosBrands.push(sosBrandData);
  await initiative.save();

  return initiative;
};

const updateSOSBrand = async (data) => {
  const { initiativeId, brandId, sosBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'sosBrands._id': brandId },
    {
      $set: {
        'sosBrands.$.name': sosBrandData.name,
        'sosBrands.$.sku': sosBrandData.sku,
        'sosBrands.$.imageURL': sosBrandData.imageURL,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('SOS brand not found');

  return updatedInitiative;
};

const deleteSOSBrand = async (data) => {
  const { initiativeId, brandId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'sosBrands._id': brandId },
    {
      $pull: { sosBrands: { _id: brandId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('SOS brand not found');

  return updatedInitiative;
};

const addOrderBrand = async (data) => {
  const { initiativeId, orderBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.orderBrands.push(orderBrandData);
  await initiative.save();

  return initiative;
};

const updateOrderBrand = async (data) => {
  const { initiativeId, brandId, orderBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'orderBrands._id': brandId },
    {
      $set: {
        'orderBrands.$.name': orderBrandData.name,
        'orderBrands.$.sku': orderBrandData.sku,
        'orderBrands.$.imageURL': orderBrandData.imageURL,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Order brand not found');

  return updatedInitiative;
};

const deleteOrderBrand = async (data) => {
  const { initiativeId, brandId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'orderBrands._id': brandId },
    {
      $pull: { orderBrands: { _id: brandId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Order brand not found');

  return updatedInitiative;
};

const addPaymentBrand = async (data) => {
  const { initiativeId, paymentBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  initiative.paymentBrands.push(paymentBrandData);
  await initiative.save();

  return initiative;
};

const updatePaymentBrand = async (data) => {
  const { initiativeId, brandId, paymentBrandData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'paymentBrands._id': brandId },
    {
      $set: {
        'paymentBrands.$.name': paymentBrandData.name,
        'paymentBrands.$.sku': paymentBrandData.sku,
        'paymentBrands.$.imageURL': paymentBrandData.imageURL,
      },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Payment brand not found');

  return updatedInitiative;
};

const deletePaymentBrand = async (data) => {
  const { initiativeId, brandId } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  const updatedInitiative = await Initiative.findOneAndUpdate(
    { _id: initiativeId, 'paymentBrands._id': brandId },
    {
      $pull: { paymentBrands: { _id: brandId } },
    },
    { new: true },
  );

  if (!updatedInitiative) throw new httpError.NotFound('Payment brand not found');

  return updatedInitiative;
};

module.exports = {
  createInitiative,
  addBrand,
  updateBrandDetails,
  deleteBrand,
  addShelfAndPosmImages,
  getAllInitiatives,
  getInitiativeDetails,
  updateInitiativeDetails,
  changeInitiativeStatus,
  deleteInitiative,
  softDeleteInitiative,
  restoreInitiative,
  addGame,
  updateGameDetails,
  deleteGame,
  addGamePrizeOption,
  updateGamePrizeOption,
  deleteGamePrizeOption,
  assignAgency,
  unassignAgency,
  addCompetitorBrand,
  updateCompetitorBrand,
  deleteCompetitorBrand,
  addInitiativeStoresFilterGroup,
  getInitiativeStoresFilterGroup,
  updateInitiativeStoresFilterGroup,
  deleteInitiativeStoresFilterGroup,
  addProductsFilterGroup,
  updateProductsFilterGroup,
  deleteProductsFilterGroup,
  addMSLBrand,
  updateMSLBrand,
  deleteMSLBrand,
  addSOSBrand,
  updateSOSBrand,
  deleteSOSBrand,
  addOrderBrand,
  updateOrderBrand,
  deleteOrderBrand,
  addPaymentBrand,
  updatePaymentBrand,
  deletePaymentBrand,
};
