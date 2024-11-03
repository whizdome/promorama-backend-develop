const Joi = require('joi');
const httpError = require('http-errors');

const { sendClientInfoEmail, sendContactUsEmail } = require('../helpers/email');

const sendClientInfo = async (req, res) => {
  const { error } = Joi.object({
    companyName: Joi.string().required(),
    companyEmail: Joi.string().email().required(),
    companyPhoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({ 'string.pattern.base': 'Company phone number must be in international format' })
      .required(),
    companyLocation: Joi.string().required(),
    contactPersonName: Joi.string().required(),
    contactPersonEmail: Joi.string().email().required(),
    contactPersonPhoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({
        'string.pattern.base': 'Contact person phone number must be in international format',
      })
      .required(),
    proposedUsersSize: Joi.string().required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await sendClientInfoEmail(req.body);

  res.status(200).send({
    status: 'success',
    message: 'Info sent successfully',
  });
};

const contactUs = async (req, res) => {
  const { error } = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    message: Joi.string().required(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await sendContactUsEmail(req.body);

  res.status(200).send({
    status: 'success',
    message: 'Message sent successfully',
  });
};

module.exports = { sendClientInfo, contactUs };
