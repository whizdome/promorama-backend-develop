const Joi = require('joi');
const httpError = require('http-errors');

const gameWinnerService = require('../services/gameWinner.service');
const { sendExcelFile } = require('../helpers/excel');

const addGameWinner = async (req, res) => {
  const { error } = Joi.object({
    gameName: Joi.string().required(),
    prizeWon: Joi.string().required(),
    winnerDetails: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phoneNumber: Joi.string().required(),
      imageURL: Joi.string(),
    }).required(),
    comment: Joi.string().required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await gameWinnerService.addGameWinner({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Game winner added successfully',
  });
};

const getAllGameWinners = async (req, res) => {
  const { gameWinners, totalCount } = await gameWinnerService.getAllGameWinners(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Game winners retrieved successfully',
    totalCount,
    data: gameWinners,
  });
};

const getGameWinnersInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await gameWinnerService.getGameWinnersInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'game_winners.xlsx' });
};

const getPrizeWonAggregatesForInitiative = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    date: Joi.date().iso(),
  }).validate(req.query);

  if (error) throw new httpError.BadRequest(error.message);

  const data = await gameWinnerService.getPrizeWonAggregatesForInitiative(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Prize won aggregates retrieved successfully',
    data,
  });
};

const updateGameWinnerDetails = async (req, res) => {
  const { error } = Joi.object({
    winnerDetails: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phoneNumber: Joi.string().required(),
      imageURL: Joi.string(),
    }),
    comment: Joi.string(),
  })
    .min(1)
    .validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await gameWinnerService.updateGameWinnerDetails({
    gameWinnerId: req.params.gameWinnerId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game winner details updated successfully',
  });
};

const togglePrizeClaimStatus = async (req, res) => {
  await gameWinnerService.togglePrizeClaimStatus(req.params.gameWinnerId);

  return res.status(200).send({
    status: 'success',
    message: 'Prize claim status updated successfully',
  });
};

const deleteGameWinner = async (req, res) => {
  await gameWinnerService.deleteGameWinner({
    gameWinnerId: req.params.gameWinnerId,
    currentUser: req.user,
  });

  res.status(200).send({
    status: 'success',
    message: 'Game winner deleted successfully',
  });
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
