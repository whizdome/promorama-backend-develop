const express = require('express');

const inventoryController = require('../controllers/inventory.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', inventoryController.getInventoriesInExcel);

router.use(isLoggedIn);

router.post(
  '/',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR, ROLE.SUPER_ADMIN),
  inventoryController.addInventory,
);
router.post(
  '/bulk',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR, ROLE.SUPER_ADMIN),
  inventoryController.addBulkInventories,
);

router.get('/', inventoryController.getAllInventories);
router.get('/aggregate', inventoryController.getAggregateInventories);
router.get('/aggregate/store', inventoryController.getAggregateInventoriesByStore);

router.patch('/:inventoryId', inventoryController.updateInventoryDetails);

router.delete('/:inventoryId', inventoryController.deleteInventory);

module.exports = router;
