const express = require('express');

const saleController = require('../controllers/sale.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', saleController.getSalesInExcel);

router.use(isLoggedIn);

router.post(
  '/',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR, ROLE.SUPER_ADMIN),
  saleController.addSale,
);

router.get('/', saleController.getAllSales);
router.get('/aggregate', saleController.getAggregateSales);
router.get('/aggregate/store', saleController.getAggregateSalesByStore);
router.get('/analytics/initiative', saleController.getInitiativeSalesAnalytics);
router.get('/analytics/initiative-store', saleController.getInitiativeStoreSalesAnalytics);
router.get('/aggregate/monthly', saleController.getMonthlyAggregateSales);

router.delete('/:saleId', saleController.deleteSale);

module.exports = router;
