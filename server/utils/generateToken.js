const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a given user ID
 * @param {string} userId - MongoDB ObjectId as string
 * @param {string} [expiresIn='7d'] - Token expiry duration
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

module.exports = generateToken;
