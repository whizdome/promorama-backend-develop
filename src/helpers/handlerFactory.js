const crypto = require('crypto');
const httpError = require('http-errors');

const { generateJwtToken } = require('./jwt');
const { sendEmailVerificationToken, sendPasswordResetTokenEmail } = require('./email');
const logger = require('../utils/customLogger');

/**
 * @param {{Model: any, email: string, password: string}} data
 */
const login = async (data) => {
  const { Model, email, password } = data;

  const user = await Model.findOne({ email }).select('+password');
  if (!user || !(await user.verifyPassword(password))) {
    throw new httpError.Unauthorized('Invalid credentials');
  }

  if (user.isDeleted) {
    throw new httpError.Unauthorized('Access denied! Your account has been deleted');
  }

  return {
    user: { _id: user._id, role: user.role },
    token: generateJwtToken({ id: user.id, role: user.role }),
  };
};

/**
 * @param {{Model: any, email: string, token: string}} data
 */
const verifyEmail = async (data) => {
  const { Model, email, token } = data;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await Model.findOne({ email }).select(
    '+emailVerificationToken +emailVerificationTokenExpires',
  );

  if (!user) throw new httpError.NotFound('User not found');

  if (user.emailVerificationToken !== hashedToken) {
    throw new httpError.BadRequest('Invalid token');
  }

  if (new Date() > user.emailVerificationTokenExpires) {
    throw new httpError.BadRequest('Token has expired');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();
};

/**
 * @param {any} Model
 * @param {string} email
 */
const resendEmailVerificationToken = async (Model, email) => {
  const user = await Model.findOne({ email });
  if (!user) throw new httpError.NotFound('User not found');

  if (user.isEmailVerified) throw new httpError.BadRequest('Email has already been verified');

  const token = user.generateEmailVerificationToken();

  await user.save();

  try {
    await sendEmailVerificationToken({ name: user.firstName, email, token });
  } catch (err) {
    logger.error(`[ResendEmailVerificationToken]: ${err.message}`);

    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    throw err;
  }
};

/**
 * @param {any} Model
 * @param {string} email
 */
const sendPasswordResetToken = async (Model, email) => {
  const user = await Model.findOne({ email });
  if (!user) throw new httpError.NotFound('User not found');

  const token = user.generatePasswordResetToken();

  await user.save();

  try {
    await sendPasswordResetTokenEmail({
      name: user.firstName || user.companyName || user.name,
      email,
      token,
    });
  } catch (err) {
    logger.error(`[SendPasswordResetToken]: ${err.message}`);

    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    throw err;
  }
};

/**
 * @param {{Model: any, email: string, token: string, password: string}} data
 */
const resetPassword = async (data) => {
  const { Model, email, token, password } = data;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await Model.findOne({ email }).select(
    '+passwordResetToken +passwordResetTokenExpires',
  );

  if (!user) throw new httpError.NotFound('User not found');

  if (user.passwordResetToken !== hashedToken) {
    throw new httpError.BadRequest('Invalid token');
  }

  if (new Date() > user.passwordResetTokenExpires) {
    throw new httpError.BadRequest('Token has expired');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();
};

module.exports = {
  verifyEmail,
  resendEmailVerificationToken,
  login,
  sendPasswordResetToken,
  resetPassword,
};
