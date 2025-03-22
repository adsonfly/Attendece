const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: '*'
});

// Register JWT plugin
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET
});

// Serve static files - CSS, JS, etc.
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/',
  decorateReply: false
});

// Register routes
fastify.register(require('./routes/user'), { prefix: '/api/users' });
fastify.register(require('./routes/attendance'), { prefix: '/api/attendance' });

// Serve the HTML pages
fastify.get('/', (req, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, '../views/index.html'));
  reply.type('text/html').send(stream);
});

fastify.get('/dashboard', (req, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, '../views/dashboard.html'));
  reply.type('text/html').send(stream);
});

fastify.get('/login', (req, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, '../views/login.html'));
  reply.type('text/html').send(stream);
});

fastify.get('/attendance', (req, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, '../views/attendance.html'));
  reply.type('text/html').send(stream);
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(500).send({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start Fastify server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 