const GameCategory = require('../models/gameCategory');

const createGameCategory = (data) => {
  return GameCategory.create(data);
};

const getGameCategories = () => {
  return GameCategory.find({});
};

const updateGameCategory = (data) => {
  const { categoryId, changes } = data;
  return GameCategory.findByIdAndUpdate(categoryId, changes, { new: true });
};

const deleteGameCategory = (categoryId) => {
  return GameCategory.findByIdAndDelete(categoryId);
};

module.exports = {
  createGameCategory,
  getGameCategories,
  updateGameCategory,
  deleteGameCategory,
};
