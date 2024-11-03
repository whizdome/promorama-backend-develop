const express = require('express');

const initiativeStoreController = require('../controllers/initiativeStore.controller');

const attendanceRouter = require('./attendance.routes');
const shelfAndPosmRouter = require('./shelfAndPosm.routes');
const inventoryRouter = require('./inventory.routes');
const saleRouter = require('./sale.routes');
const competitorRouter = require('./competitor.routes');
const gameWinnerRouter = require('./gameWinner.routes');
const priceCheckRouter = require('./priceCheck.routes');
const storeInventoryRouter = require('./storeInventory.routes');
const shipmentRouter = require('./shipment.routes');
const orderRouter = require('./order.routes');
const paymentRouter = require('./payment.routes');
const mustStockListRouter = require('./mustStockList.routes');
const shareOfShelfRouter = require('./shareOfShelf.routes');
const initiativeStoresReportRouter = require('./initiativeStoresReport.routes');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', initiativeStoreController.getInitiativeStoresInExcel);
router.get(
  '/no-submission/excel',

  initiativeStoreController.getInitiativeStoresWithNoSubmissionInExcel,
);

router.use(isLoggedIn);

router.use('/:initiativeStoreId/attendances', attendanceRouter);
router.use('/:initiativeStoreId/shelf-and-posm', shelfAndPosmRouter);
router.use('/:initiativeStoreId/inventories', inventoryRouter);
router.use('/:initiativeStoreId/sales', saleRouter);
router.use('/:initiativeStoreId/competitors', competitorRouter);
router.use('/:initiativeStoreId/game-winners', gameWinnerRouter);
router.use('/:initiativeStoreId/price-checks', priceCheckRouter);
router.use('/:initiativeStoreId/store-inventories', storeInventoryRouter);
router.use('/:initiativeStoreId/shipments', shipmentRouter);
router.use('/:initiativeStoreId/orders', orderRouter);
router.use('/:initiativeStoreId/payments', paymentRouter);
router.use('/:initiativeStoreId/msl', mustStockListRouter);
router.use('/:initiativeStoreId/sos', shareOfShelfRouter);
router.use('/:initiativeStoreId/initiative-stores-reports', initiativeStoresReportRouter);

router.post(
  '/',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  initiativeStoreController.createInitiativeStore,
);
router.post('/:initiativeStoreId/game-prizes', initiativeStoreController.addGamePrize);
router.post(
  '/game-prizes/multiple-stores',
  initiativeStoreController.addGamePrizeToInitiativeStores,
);

router.get('/', initiativeStoreController.getInitiativeStores);
router.get(
  '/assigned',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  initiativeStoreController.getAssignedInitiativeStores,
);
router.get('/no-submission', initiativeStoreController.getInitiativeStoresWithNoSubmission);
router.get('/:initiativeStoreId', initiativeStoreController.getInitiativeStoreDetails);

router.patch(
  '/:initiativeStoreId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  initiativeStoreController.updateInitiativeStore,
);
router.patch(
  '/:initiativeStoreId/restore',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  initiativeStoreController.restoreInitiativeStore,
);
router.patch(
  '/:initiativeStoreId/game-prizes/:gamePrizeId',
  initiativeStoreController.updateGamePrizeDetails,
);

router.delete(
  '/:initiativeStoreId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  initiativeStoreController.deleteInitiativeStore,
);
router.delete(
  '/:initiativeStoreId/soft',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  initiativeStoreController.softDeleteInitiativeStore,
);
router.delete(
  '/:initiativeStoreId/game-prizes/:gamePrizeId',
  initiativeStoreController.deleteGamePrize,
);

module.exports = router;
