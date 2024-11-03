const express = require('express');

const surveyController = require('../controllers/survey.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.use(isLoggedIn);

router.post(
  '/',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  surveyController.createSurvey,
);
router.post(
  '/:surveyId/questions',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  surveyController.addQuestion,
);

router.get('/', surveyController.getSurveys);
router.get('/:surveyId', surveyController.getSurveyDetails);

router.patch(
  '/:surveyId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  surveyController.updateSurveyDetails,
);
router.patch(
  '/:surveyId/active-status',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  surveyController.updateActiveStatus,
);
router.patch(
  '/:surveyId/questions/:questionId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  surveyController.updateQuestionDetails,
);

router.delete('/:surveyId', authorize(ROLE.SUPER_ADMIN), surveyController.deleteSurvey);
router.delete(
  '/:surveyId/questions/:questionId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  surveyController.deleteQuestion,
);

module.exports = router;
