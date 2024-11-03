const express = require('express');

const mustStockListController = require('../controllers/mustStockList.controller');

const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.get('/excel', mustStockListController.getMSLsInExcel);

router.use(isLoggedIn);

router.post('/', mustStockListController.addMSL);
router.post('/bulk', mustStockListController.addBulkMSLs);

router.get('/', mustStockListController.getMSLs);
router.get('/aggregate', mustStockListController.getAggregateMSLs);
router.get('/aggregate/store', mustStockListController.getAggregateMSLsByStore);

router.patch('/:id', mustStockListController.updateMSLDetails);

router.delete('/:id', mustStockListController.deleteMSL);

module.exports = router;
