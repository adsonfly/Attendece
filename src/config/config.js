module.exports = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance',
  dbName: process.env.DB_NAME || 'attendance',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  port: process.env.PORT || 3000
};
