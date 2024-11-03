const express = require('express');

const initiativeStoresReportController = require('../controllers/initiativeStoresReport.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', initiativeStoresReportController.getReportsInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPERVISOR), initiativeStoresReportController.createReport);

router.get('/', initiativeStoresReportController.getReports);

router.patch('/:reportId', initiativeStoresReportController.updateReportDetails);

router.delete('/:reportId', initiativeStoresReportController.deleteReport);

module.exports = router;
