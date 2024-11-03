const jwt = require('jsonwebtoken');

/** Generates a jwt token
 * @param {{id: String, role: String}} payload
 * @param {String} lifespan
 * @returns {String} string
 */
const generateJwtToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

module.exports = { generateJwtToken };
