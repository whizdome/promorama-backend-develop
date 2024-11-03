const express = require('express');

const storeInventoryController = require('../controllers/storeInventory.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', storeInventoryController.getStoreInventoriesInExcel);

router.use(isLoggedIn);

router.post('/', storeInventoryController.addStoreInventory);

router.get('/', storeInventoryController.getStoreInventories);
router.get('/aggregate', storeInventoryController.getAggregateStoreInventories);
router.get('/aggregate/store', storeInventoryController.getAggregateStoreInventoriesByStore);

router.patch(
  '/:storeInventoryId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  storeInventoryController.updateStoreInventoryDetails,
);

router.delete(
  '/:storeInventoryId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  storeInventoryController.deleteStoreInventory,
);

module.exports = router;
