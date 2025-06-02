const jwt = require('jsonwebtoken');
require("dotenv").config();
const {db}  = require('../config/db');
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication failed - Token missing on header' });
    }

    const token = req.headers['authorization'].split(' ')[1];
    console.log("token", token);

    if (!token) {
      return res.status(401).json({ message: 'Authentication failed ' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const adminRecord = await db.Admin.findOne();

    if (adminRecord.token_version != decodedToken.token_version) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    next();
  } catch (error) {
    console.error('Error verifying JWT:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { authMiddleware};