const express = require('express');

const surveyResponseController = require('../controllers/surveyResponse.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', surveyResponseController.getSurveyResponsesInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.PROMOTER), surveyResponseController.createSurveyResponse);

router.get('/', surveyResponseController.getSurveyResponses);
router.get('/:surveyResponseId', surveyResponseController.getSurveyResponseDetails);

router.patch(
  '/:surveyResponseId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.PROMOTER),
  surveyResponseController.updateSurveyResponseDetails,
);

router.delete(
  '/:surveyResponseId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.PROMOTER),
  surveyResponseController.deleteSurveyResponse,
);

module.exports = router;
