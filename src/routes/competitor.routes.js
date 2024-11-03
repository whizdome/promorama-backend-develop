const express = require('express');

const competitorController = require('../controllers/competitor.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', competitorController.getCompetitorsInExcel);

router.use(isLoggedIn);

router.post(
  '/',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR, ROLE.SUPER_ADMIN),
  competitorController.addCompetitor,
);

router.get('/', competitorController.getAllCompetitors);
router.get('/aggregate', competitorController.getAggregateCompetitors);
router.get('/aggregate/store', competitorController.getAggregateCompetitorsByStore);

router.patch('/:competitorId', competitorController.updateCompetitorDetails);

router.delete('/:competitorId', competitorController.deleteCompetitor);

module.exports = router;
