const periodicMailRouter = require('express').Router();

const { weeklyMail, monthlyMail, analytics } = require('../controllers/periodicMail.controller');
const { ROLE } = require('../helpers/constants');
const { isLoggedIn, authorize } = require('../middleware/auth.middleware');

periodicMailRouter.post('/weekly', isLoggedIn, authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), weeklyMail);
periodicMailRouter.post(
  '/monthly',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  monthlyMail,
);
periodicMailRouter.get(
  '/analytics',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  analytics,
);

module.exports = { periodicMailRouter };
