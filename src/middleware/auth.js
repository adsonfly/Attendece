const jwt = require('jsonwebtoken');
require('dotenv').config();

async function authenticate(req, reply) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({
        success: false,
        message: 'Authorization header is missing'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        success: false,
        message: 'Token has expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = { authenticate }; 