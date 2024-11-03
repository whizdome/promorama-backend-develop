const Joi = require('joi');
const httpError = require('http-errors');

const gameCategoryService = require('../services/gameCategory.service');

const validateGameCategoryData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    imageURL: Joi.string(),
  });

  return schema.validate(data);
};

const createGameCategory = async (req, res) => {
  const { error } = validateGameCategoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const gameCategory = await gameCategoryService.createGameCategory(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Game category created successfully',
    data: gameCategory,
  });
};

const getGameCategories = async (req, res) => {
  const gameCategories = await gameCategoryService.getGameCategories();

  res.status(200).send({
    status: 'success',
    message: 'Game categories retrieved successfully',
    data: gameCategories,
  });
};

const updateGameCategory = async (req, res) => {
  const { error } = validateGameCategoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const gameCategory = await gameCategoryService.updateGameCategory({
    categoryId: req.params.categoryId,
    changes: req.body,
  });

  if (!gameCategory) throw new httpError.NotFound('Game category not found');

  return res.status(200).send({
    status: 'success',
    message: 'Game category updated successfully',
    data: gameCategory,
  });
};

const deleteGameCategory = async (req, res) => {
  const gameCategory = await gameCategoryService.deleteGameCategory(req.params.categoryId);
  if (!gameCategory) throw new httpError.NotFound('Game category not found');

  res.status(200).send({
    status: 'success',
    message: 'Game category deleted successfully',
  });
};

module.exports = {
  createGameCategory,
  getGameCategories,
  updateGameCategory,
  deleteGameCategory,
};
