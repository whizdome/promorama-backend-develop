const express = require('express');

const adminController = require('../controllers/admin.controller');

const { ROLE } = require('../helpers/constants');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', isLoggedIn, authorize(ROLE.SUPER_ADMIN), adminController.createAdmin);
router.get('/', isLoggedIn, authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), adminController.getAllAdmins);
router.get('/excel', adminController.getAdminsInExcel);
router.get(
  '/profile',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  adminController.getProfileDetails,
);
router.get(
  '/:adminId',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  adminController.getAdminDetails,
);
router.patch(
  '/change-password',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  adminController.updateAdminPassword,
);
router.patch(
  '/:adminId',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  adminController.updateAdminDetails,
);
router.patch(
  '/:adminId/change-role',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN),
  adminController.changeAdminRole,
);
router.delete('/:adminId', isLoggedIn, authorize(ROLE.SUPER_ADMIN), adminController.deleteAdmin);

module.exports = router;
