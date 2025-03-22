const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

function userRoutes(fastify, options, done) {
  // Register a new user (shop owner)
  fastify.post('/register', userController.registerUser);
  
  // Login a user
  fastify.post('/login', userController.loginUser);
  
  // Get user profile (protected route)
  fastify.get('/profile', { onRequest: authenticate }, userController.getUserProfile);
  
  // Get current user (protected route)
  fastify.get('/me', { onRequest: authenticate }, userController.getUserProfile);
  
  done();
}

module.exports = userRoutes; 