const express = require('express');

const subuserController = require('../controllers/subuser.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.get('/excel', subuserController.getSubusersInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.CLIENT), subuserController.addSubuser);

router.get('/', subuserController.getSubusers);
router.get('/profile', authorize(ROLE.BASIC_SUBUSER), subuserController.getSubuserProfile);
router.get('/initiatives', authorize(ROLE.BASIC_SUBUSER), subuserController.getAssignedInitiatives);
router.get('/:subuserId', subuserController.getSubuserDetails);

router.patch(
  '/change-password',
  authorize(ROLE.BASIC_SUBUSER),
  subuserController.updateSubuserPassword,
);
router.patch('/:subuserId', authorize(ROLE.CLIENT), subuserController.updateSubuserDetails);
router.patch('/:subuserId/restore', subuserController.restoreSubuser);
router.patch(
  '/:subuserId/assign-initiative',
  authorize(ROLE.CLIENT),
  subuserController.assignInitiative,
);
router.patch(
  '/:subuserId/unassign-initiative',
  authorize(ROLE.CLIENT),
  subuserController.unassignInitiative,
);

router.delete('/:subuserId', subuserController.deleteSubuser);
router.delete('/:subuserId/soft', subuserController.softDeleteSubuser);

module.exports = router;
