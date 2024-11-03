const express = require('express');

const storeController = require('../controllers/store.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.post('/', isLoggedIn, storeController.addStore);

router.get('/', isLoggedIn, storeController.getAllStores);
router.get('/excel', storeController.getStoresInExcel);
router.get('/within', isLoggedIn, storeController.getNearestStores);
router.get('/:storeId', isLoggedIn, storeController.getStoreDetails);

router.patch('/:storeId', isLoggedIn, storeController.updateStoreDetails);
router.patch(
  '/:storeId/approve',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  storeController.approveStore,
);
router.patch(
  '/:storeId/restore',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  storeController.restoreStore,
);
router.patch(
  '/:storeId/add-client',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  storeController.addClient,
);
router.patch(
  '/:storeId/remove-client',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  storeController.removeClient,
);

router.delete('/:storeId', isLoggedIn, storeController.deleteStore);
router.delete(
  '/:storeId/soft',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  storeController.softDeleteStore,
);

module.exports = router;
