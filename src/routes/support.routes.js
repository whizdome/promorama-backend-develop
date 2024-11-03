const express = require('express');

const supportController = require('../controllers/support.controller');

const router = express.Router();

router.post('/send-client-info', supportController.sendClientInfo);
router.post('/contact-us', supportController.contactUs);

module.exports = router;
