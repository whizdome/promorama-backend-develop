const express = require('express');

const gameCategoryController = require('../controllers/gameCategory.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.post(
  '/',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  gameCategoryController.createGameCategory,
);

router.get('/', isLoggedIn, gameCategoryController.getGameCategories);

router.patch(
  '/:categoryId',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  gameCategoryController.updateGameCategory,
);

router.delete(
  '/:categoryId',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  gameCategoryController.deleteGameCategory,
);

module.exports = router;
