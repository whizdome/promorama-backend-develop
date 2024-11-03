const express = require('express');

const shareOfShelfController = require('../controllers/shareOfShelf.controller');

const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.get('/excel', shareOfShelfController.getSOSsInExcel);

router.use(isLoggedIn);

router.post('/', shareOfShelfController.addSOS);

router.get('/', shareOfShelfController.getSOSs);
router.get('/aggregate', shareOfShelfController.getAggregateSOSs);
router.get('/aggregate/store', shareOfShelfController.getAggregateSOSsByStore);
router.get(
  '/aggregate/store-and-product',
  shareOfShelfController.getAggregateSOSsByStoreAndProduct,
);

router.patch('/:id', shareOfShelfController.updateSOSDetails);

router.delete('/:id', shareOfShelfController.deleteSOS);

module.exports = router;
