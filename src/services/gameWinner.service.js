const httpError = require('http-errors');
const mongoose = require('mongoose');

const InitiativeStore = require('../models/initiativeStore.model');
const GameWinner = require('../models/gameWinner');

const APIFeatures = require('../utils/apiFeatures');
const { sendGameWinnerEmail } = require('../helpers/email');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { ROLE, EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');

const addGameWinner = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId)
    .populate({ path: 'initiative', select: 'name' })
    .populate({ path: 'store', select: 'name' });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  const gamePrizeDetails = initiativeStore.gamePrizes.find(
    (prize) => prize.name === reqBody.prizeWon,
  );

  if (!gamePrizeDetails || gamePrizeDetails.quantityAvailable === 0) {
    throw new httpError.BadRequest('Prize won not available');
  }

  await InitiativeStore.updateOne(
    { _id: initiativeStoreId, 'gamePrizes.name': reqBody.prizeWon },
    { $inc: { 'gamePrizes.$.quantityAvailable': -1 } },
  );

  const gameWinner = await GameWinner.create({
    initiative: initiativeStore.initiative._id,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    ...reqBody,
  });

  sendGameWinnerEmail({
    name: reqBody.winnerDetails.name,
    email: reqBody.winnerDetails.email,
    prizeWon: reqBody.prizeWon,
    storeName: initiativeStore.store.name,
    initiativeName: initiativeStore.initiative.name,
  });

  return gameWinner;
};

const getAllGameWinners = async (reqQuery) => {
  const apiFeatures = new APIFeatures(GameWinner.find({}), reqQuery)
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

  const gameWinners = await apiFeatures.query;
  const totalCount = await GameWinner.countDocuments({
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { gameWinners, totalCount };
};

const getGameWinnersInExcel = async (reqQuery) => {
  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(GameWinner.find({}), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const gameWinners = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return gameWinners.map((gameWinner) => ({
    Date: gameWinner.createdAt.toISOString().split('T')[0],
    'Store Name': gameWinner.initiativeStore?.store?.name,
    State: gameWinner.initiativeStore?.store?.state,
    'Game Name': gameWinner.gameName,
    'Prize Won': gameWinner.prizeWon,
    Status: gameWinner.isPrizeClaimed ? 'Claimed' : 'Unclaimed',
    'Winner Name': gameWinner.winnerDetails.name,
    'Winner Email': gameWinner.winnerDetails.email,
    'Winner Phone Number': gameWinner.winnerDetails.phoneNumber,
    'Winner Image Link': gameWinner.winnerDetails.imageURL,
    Comment: gameWinner.comment,
    Creator: `${gameWinner.user?.firstName || ''} ${gameWinner.user?.lastName || ''}`,
    'Creator Role': gameWinner.user?.role,
  }));
};

const getPrizeWonAggregatesForInitiative = async (reqQuery) => {
  const { initiativeId, date } = reqQuery;

  const filter = { initiative: new mongoose.Types.ObjectId(initiativeId) };
  if (date) {
    const startDate = new Date(new Date(date).setHours(0, 0, 0, 0));
    const endDate = new Date(new Date(date).setHours(23, 59, 59, 999));

    filter.createdAt = { $gte: startDate, $lte: endDate };
  }

  const result = await GameWinner.aggregate([
    { $match: filter },
    { $group: { _id: '$prizeWon', count: { $sum: 1 } } },
    { $project: { _id: 0, prize: '$_id', count: 1 } },
    { $sort: { count: -1 } },
    // { $group: { _id: { gameName: '$gameName', prizeWon: '$prizeWon' }, count: { $sum: 1 } } },
    // { $project: { _id: 0, gameName: '$_id.gameName', prizeWon: '$_id.prizeWon', count: 1 } },
    // { $sort: { count: -1 } },
  ]);

  return {
    date: date || null,
    result,
  };
};

const updateGameWinnerDetails = async (data) => {
  const { gameWinnerId, currentUser, changes } = data;

  const gameWinner = await GameWinner.findById(gameWinnerId);
  if (!gameWinner) throw new httpError.NotFound('Game winner not found');

  if (
    currentUser.role === ROLE.PROMOTER &&
    (gameWinner.isPrizeClaimed || gameWinner.user.toString() !== currentUser.id)
  ) {
    throw new httpError.Forbidden('You are not allowed to update this game winner document');
  }

  await GameWinner.updateOne({ _id: gameWinnerId }, changes);
};

const togglePrizeClaimStatus = async (gameWinnerId) => {
  const gameWinner = await GameWinner.findById(gameWinnerId);
  if (!gameWinner) throw new httpError.NotFound('Game winner not found');

  gameWinner.isPrizeClaimed = !gameWinner.isPrizeClaimed;
  await gameWinner.save();
};

const deleteGameWinner = async (data) => {
  const { gameWinnerId, currentUser } = data;

  const gameWinner = await GameWinner.findById(gameWinnerId);
  if (!gameWinner) throw new httpError.NotFound('Game winner not found');

  if (
    currentUser.role === ROLE.PROMOTER &&
    (gameWinner.isPrizeClaimed || gameWinner.user.toString() !== currentUser.id)
  ) {
    throw new httpError.Forbidden('You are not allowed to delete this game winner document');
  }

  await GameWinner.deleteOne({ _id: gameWinnerId });
};

module.exports = {
  addGameWinner,
  getAllGameWinners,
  getGameWinnersInExcel,
  getPrizeWonAggregatesForInitiative,
  updateGameWinnerDetails,
  togglePrizeClaimStatus,
  deleteGameWinner,
};
