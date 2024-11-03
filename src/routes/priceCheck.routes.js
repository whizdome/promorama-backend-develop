const express = require('express');

const priceCheckController = require('../controllers/priceCheck.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', priceCheckController.getPriceChecksInExcel);

router.use(isLoggedIn);

router.post(
  '/',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR, ROLE.SUPER_ADMIN),
  priceCheckController.addPriceCheck,
);
router.post(
  '/bulk',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR, ROLE.SUPER_ADMIN),
  priceCheckController.addBulkPriceChecks,
);

router.get('/', priceCheckController.getAllPriceChecks);
router.get('/aggregate', priceCheckController.getAggregatePriceChecks);
router.get('/aggregate/store', priceCheckController.getAggregatePriceChecksByStore);

router.patch('/:priceCheckId', priceCheckController.updatePriceCheckDetails);

router.delete('/:priceCheckId', priceCheckController.deletePriceCheck);

module.exports = router;
