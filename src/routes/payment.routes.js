const express = require('express');

const paymentController = require('../controllers/payment.controller');

const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

router.get('/excel', paymentController.getPaymentsInExcel);

router.use(isLoggedIn);

router.post('/', paymentController.addPayment);

router.get('/', paymentController.getPayments);
router.get('/aggregate', paymentController.getAggregatePayments);
router.get('/aggregate/store', paymentController.getAggregatePaymentsByStore);

router.patch('/:paymentId', paymentController.updatePaymentDetails);

router.delete('/:paymentId', paymentController.deletePayment);

module.exports = router;
