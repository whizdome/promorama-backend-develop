const Admin = require('../models/admin.model');

const logger = require('../utils/customLogger');
const { ROLE } = require('./constants');

const createDefaultAdmin = async () => {
  try {
    const admin = await Admin.findOne({ role: ROLE.SUPER_ADMIN, isDefaultAdmin: true });
    if (admin) return;

    await Admin.create({
      firstName: process.env.ADMIN_FIRST_NAME,
      lastName: process.env.ADMIN_LAST_NAME,
      email: process.env.ADMIN_EMAIL,
      phoneNumber: process.env.ADMIN_PHONE_NUMBER,
      password: process.env.ADMIN_PASSWORD,
      role: ROLE.SUPER_ADMIN,
      isDefaultAdmin: true,
    });
  } catch (err) {
    logger.error(`[CreateDefaultAdmin]: ${err.message}`);
  }
};

module.exports = createDefaultAdmin;
