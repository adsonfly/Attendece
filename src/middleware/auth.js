const jwt = require('jsonwebtoken');
require('dotenv').config();

async function authenticate(request, reply) {
  try {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = await request.server.jwt.verify(token);
    request.user = { id: decoded.id };
  } catch (error) {
    reply.code(401).send({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };