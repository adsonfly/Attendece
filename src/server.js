const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('./config/db');
const config = require('./config/config');
require('dotenv').config();

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: '*'
});

// Register JWT plugin
fastify.register(require('@fastify/jwt'), {
  secret: config.jwtSecret
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

fastify.get('/history', (req, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, '../views/history.html'));
  reply.type('text/html').send(stream);
});

// Error handler
fastify.setErrorHandler(function (error, request, reply) {
  fastify.log.error(error);
  reply.status(500).send({ 
    success: false, 
    message: error.message || 'Internal Server Error'
  });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB first
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Then start the server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server is running on port ${config.port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();