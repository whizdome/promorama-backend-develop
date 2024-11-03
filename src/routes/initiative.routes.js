const express = require('express');

const initiativeController = require('../controllers/initiative.controller');

const initiativeStoreRouter = require('./initiativeStore.routes');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.use(isLoggedIn);

router.get('/:initiativeId', initiativeController.getInitiativeDetails);
router.use('/:initiativeId/initiative-stores', initiativeStoreRouter);

router.use(authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.AGENCY, ROLE.CLIENT));

router.post('/', initiativeController.createInitiative);
router.post('/:initiativeId/brands', initiativeController.addBrand);
router.post('/:initiativeId/games', initiativeController.addGame);
router.post('/:initiativeId/game-prize-options', initiativeController.addGamePrizeOption);
router.post('/:initiativeId/competitor-brands', initiativeController.addCompetitorBrand);
router.post('/:initiativeId/msl-brands', initiativeController.addMSLBrand);
router.post('/:initiativeId/sos-brands', initiativeController.addSOSBrand);
router.post('/:initiativeId/order-brands', initiativeController.addOrderBrand);
router.post('/:initiativeId/payment-brands', initiativeController.addPaymentBrand);
router.post(
  '/:initiativeId/initiative-stores-filter-groups',
  initiativeController.addInitiativeStoresFilterGroup,
);
router.post('/:initiativeId/products-filter-groups', initiativeController.addProductsFilterGroup);

router.get('/', initiativeController.getAllInitiatives);
router.get(
  '/:initiativeId/initiative-stores-filter-groups/:groupId',
  initiativeController.getInitiativeStoresFilterGroup,
);

router.patch('/:initiativeId', initiativeController.updateInitiativeDetails);
router.patch('/:initiativeId/change-status', initiativeController.changeInitiativeStatus);
router.patch('/:initiativeId/brands/:brandId', initiativeController.updateBrandDetails);
router.patch('/:initiativeId/shelf-and-posm-images', initiativeController.addShelfAndPosmImages);
router.patch('/:initiativeId/restore', initiativeController.restoreInitiative);
router.patch('/:initiativeId/games/:gameId', initiativeController.updateGameDetails);
router.patch(
  '/:initiativeId/game-prize-options/:gamePrizeOptionId',
  initiativeController.updateGamePrizeOption,
);
router.patch(
  '/:initiativeId/assign-agency',
  authorize(ROLE.CLIENT),
  initiativeController.assignAgency,
);
router.patch(
  '/:initiativeId/unassign-agency',
  authorize(ROLE.CLIENT),
  initiativeController.unassignAgency,
);
router.patch(
  '/:initiativeId/competitor-brands/:brandId',
  initiativeController.updateCompetitorBrand,
);
router.patch('/:initiativeId/msl-brands/:brandId', initiativeController.updateMSLBrand);
router.patch('/:initiativeId/sos-brands/:brandId', initiativeController.updateSOSBrand);
router.patch('/:initiativeId/order-brands/:brandId', initiativeController.updateOrderBrand);
router.patch('/:initiativeId/payment-brands/:brandId', initiativeController.updatePaymentBrand);
router.patch(
  '/:initiativeId/initiative-stores-filter-groups/:groupId',
  initiativeController.updateInitiativeStoresFilterGroup,
);
router.patch(
  '/:initiativeId/products-filter-groups/:groupId',
  initiativeController.updateProductsFilterGroup,
);

router.delete('/:initiativeId/brands/:brandId', initiativeController.deleteBrand);
router.delete('/:initiativeId', initiativeController.deleteInitiative);
router.delete('/:initiativeId/soft', initiativeController.softDeleteInitiative);
router.delete('/:initiativeId/games/:gameId', initiativeController.deleteGame);
router.delete(
  '/:initiativeId/game-prize-options/:gamePrizeOptionId',
  initiativeController.deleteGamePrizeOption,
);
router.delete(
  '/:initiativeId/competitor-brands/:brandId',
  initiativeController.deleteCompetitorBrand,
);
router.delete('/:initiativeId/msl-brands/:brandId', initiativeController.deleteMSLBrand);
router.delete('/:initiativeId/sos-brands/:brandId', initiativeController.deleteSOSBrand);
router.delete('/:initiativeId/order-brands/:brandId', initiativeController.deleteOrderBrand);
router.delete('/:initiativeId/payment-brands/:brandId', initiativeController.deletePaymentBrand);
router.delete(
  '/:initiativeId/initiative-stores-filter-groups/:groupId',
  initiativeController.deleteInitiativeStoresFilterGroup,
);
router.delete(
  '/:initiativeId/products-filter-groups/:groupId',
  initiativeController.deleteProductsFilterGroup,
);

module.exports = router;
