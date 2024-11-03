const express = require('express');

const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/sign-up', authController.signUp);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-email-verification-token', authController.resendEmailVerificationToken);
router.post('/forgot-password', authController.sendPasswordResetToken);
router.post('/reset-password', authController.resetPassword);

router.post('/admins/login', authController.loginAdmin);
router.post('/admins/forgot-password', authController.sendAdminPasswordResetToken);
router.post('/admins/reset-password', authController.resetAdminPassword);

router.post('/clients/login', authController.loginClient);
router.post('/clients/forgot-password', authController.sendClientPasswordResetToken);
router.post('/clients/reset-password', authController.resetClientPassword);

router.post('/agencies/login', authController.loginAgency);
router.post('/agencies/forgot-password', authController.sendAgencyPasswordResetToken);
router.post('/agencies/reset-password', authController.resetAgencyPassword);

router.post('/subusers/login', authController.loginSubuser);
router.post('/subusers/forgot-password', authController.sendSubuserPasswordResetToken);
router.post('/subusers/reset-password', authController.resetSubuserPassword);

module.exports = router;
