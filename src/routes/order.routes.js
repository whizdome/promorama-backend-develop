const express = require('express');

const orderController = require('../controllers/order.controller');

const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.get('/excel', orderController.getOrdersInExcel);

router.use(isLoggedIn);

router.post('/', orderController.addOrder);

router.get('/', orderController.getOrders);
router.get('/aggregate', orderController.getAggregateOrders);
router.get('/aggregate/store', orderController.getAggregateOrdersByStore);

router.patch('/:orderId', orderController.updateOrderDetails);

router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;
