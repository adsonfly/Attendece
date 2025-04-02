const { MongoClient } = require('mongodb');
const config = require('./config');

const mongoURI = config.mongoUri;
const dbName = config.dbName;
let db = null;
let client = null;

async function connectToDatabase() {
  try {
    if (db) return db;

    client = new MongoClient(mongoURI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}

async function closeConnection() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connectToDatabase,
  getDb,
  closeConnection,
  mongoURI,
  dbName
};