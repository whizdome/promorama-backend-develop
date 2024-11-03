const express = require('express');

const appDataController = require('../controllers/appData.controller');

const { isLoggedIn } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(isLoggedIn);

router.post('/', appDataController.updateAppData);

router.get('/', appDataController.getAppData);

module.exports = router;
