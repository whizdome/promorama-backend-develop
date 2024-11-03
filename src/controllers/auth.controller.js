const httpError = require('http-errors');

const authService = require('../services/auth.service');

const {
  validateSignUpData,
  validateLoginData,
  validateEmailVerificationData,
  validateEmail,
  validatePasswordResetData,
} = require('../helpers/validators/auth.validators');

const signUp = async (req, res) => {
  const { error } = validateSignUpData(req.body);
  if (error) {
    throw new httpError.BadRequest(error.message);
  }

  await authService.signUp(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Registered successfully. Check your email for the verification token',
  });
};

const login = async (req, res) => {
  const { error } = validateLoginData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const data = await authService.login(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Login successfully',
    data,
  });
};

const verifyEmail = async (req, res) => {
  const { error } = validateEmailVerificationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.verifyEmail(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Email verified successfully',
  });
};

const resendEmailVerificationToken = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.resendEmailVerificationToken(req.body.email);

  return res.status(200).send({
    status: 'success',
    message: 'Email verification token sent successfully',
  });
};

const sendPasswordResetToken = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.sendPasswordResetToken(req.body.email);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset token sent successfully',
  });
};

const resetPassword = async (req, res) => {
  const { error } = validatePasswordResetData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.resetPassword(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset successfully',
  });
};

const loginAdmin = async (req, res) => {
  const { error } = validateLoginData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const data = await authService.loginAdmin(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Login successfully',
    data,
  });
};

const sendAdminPasswordResetToken = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.sendAdminPasswordResetToken(req.body.email);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset token sent successfully',
  });
};

const resetAdminPassword = async (req, res) => {
  const { error } = validatePasswordResetData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.resetAdminPassword(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset successfully',
  });
};

const loginClient = async (req, res) => {
  const { error } = validateLoginData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const data = await authService.loginClient(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Login successfully',
    data,
  });
};

const sendClientPasswordResetToken = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.sendClientPasswordResetToken(req.body.email);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset token sent successfully',
  });
};

const resetClientPassword = async (req, res) => {
  const { error } = validatePasswordResetData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.resetClientPassword(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset successfully',
  });
};

const loginAgency = async (req, res) => {
  const { error } = validateLoginData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const data = await authService.loginAgency(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Login successfully',
    data,
  });
};

const sendAgencyPasswordResetToken = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.sendAgencyPasswordResetToken(req.body.email);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset token sent successfully',
  });
};

const resetAgencyPassword = async (req, res) => {
  const { error } = validatePasswordResetData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.resetAgencyPassword(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset successfully',
  });
};

const loginSubuser = async (req, res) => {
  const { error } = validateLoginData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const data = await authService.loginSubuser(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Login successfully',
    data,
  });
};

const sendSubuserPasswordResetToken = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.sendSubuserPasswordResetToken(req.body.email);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset token sent successfully',
  });
};

const resetSubuserPassword = async (req, res) => {
  const { error } = validatePasswordResetData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await authService.resetSubuserPassword(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Password reset successfully',
  });
};

module.exports = {
  signUp,
  login,
  verifyEmail,
  resendEmailVerificationToken,
  sendPasswordResetToken,
  resetPassword,
  loginAdmin,
  sendAdminPasswordResetToken,
  resetAdminPassword,
  loginClient,
  sendClientPasswordResetToken,
  resetClientPassword,
  loginAgency,
  sendAgencyPasswordResetToken,
  resetAgencyPassword,
  loginSubuser,
  sendSubuserPasswordResetToken,
  resetSubuserPassword,
};
