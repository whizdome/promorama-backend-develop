const express = require('express');

const storeCategoryController = require('../controllers/storeCategory.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPER_ADMIN), storeCategoryController.createStoreCategory);
router.post('/:categoryId/types', authorize(ROLE.SUPER_ADMIN), storeCategoryController.addType);

router.get('/', storeCategoryController.getStoreCategories);
router.get('/:categoryId', storeCategoryController.getStoreCategoryDetails);

router.patch(
  '/:categoryId',
  authorize(ROLE.SUPER_ADMIN),
  storeCategoryController.updateStoreCategory,
);
router.patch(
  '/:categoryId/selection-status',
  authorize(ROLE.SUPER_ADMIN),
  storeCategoryController.updateSelectionStatus,
);
router.patch(
  '/:categoryId/types/:typeId',
  authorize(ROLE.SUPER_ADMIN),
  storeCategoryController.updateTypeDetails,
);

router.delete(
  '/:categoryId',
  authorize(ROLE.SUPER_ADMIN),
  storeCategoryController.deleteStoreCategory,
);
router.delete(
  '/:categoryId/types/:typeId',
  authorize(ROLE.SUPER_ADMIN),
  storeCategoryController.deleteType,
);

module.exports = router;
