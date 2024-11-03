const express = require('express');

const reportController = require('../controllers/report.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', reportController.getReportsInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPERVISOR), reportController.addReport);

router.get('/', reportController.getAllReports);

router.patch('/:reportId', reportController.updateReportDetails);

router.delete('/:reportId', reportController.deleteReport);

module.exports = router;
