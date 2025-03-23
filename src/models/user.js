const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

const COLLECTION = 'users';

async function createUser(userData) {
  const db = getDb();
  const result = await db.collection(COLLECTION).insertOne({
    storeName: userData.storeName,
    phoneNumber: userData.phoneNumber,
    password: userData.password,
    createdAt: new Date()
  });
  return result.insertedId;
}

async function findUserByPhone(phoneNumber) {
  const db = getDb();
  return db.collection(COLLECTION).findOne({ phoneNumber });
}

async function findUserById(id) {
  const db = getDb();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

async function getAllUsers() {
  const db = getDb();
  return db.collection(COLLECTION).find({}).toArray();
}

module.exports = {
  createUser,
  findUserByPhone,
  findUserById,
  getAllUsers
};