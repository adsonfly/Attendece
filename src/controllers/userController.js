const userModel = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function registerUser(req, reply) {
  try {
    const { storeName, phoneNumber, password } = req.body;
    
    if (!storeName || !phoneNumber || !password) {
      return reply.code(400).send({
        success: false,
        message: 'Store Name, Phone Number, and Password are required'
      });
    }
    
    const existingUser = await userModel.findUserByPhone(phoneNumber);
    if (existingUser) {
      return reply.code(400).send({
        success: false,
        message: 'User with this phone number already exists'
      });
    }
    
    const userId = await userModel.createUser({
      storeName,
      phoneNumber,
      password
    });
    
    const token = jwt.sign(
      { id: userId, phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return reply.code(201).send({
      success: true,
      message: 'Registration successful',
      user: { id: userId, storeName, phoneNumber },
      token
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function loginUser(req, reply) {
  try {
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
      return reply.code(400).send({
        success: false,
        message: 'Phone Number and Password are required'
      });
    }
    
    const user = await userModel.findUserByPhone(phoneNumber);
    if (!user || user.password !== password) {
      return reply.code(400).send({
        success: false,
        message: 'Invalid phone number or password'
      });
    }
    
    const token = jwt.sign(
      { id: user._id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return reply.code(200).send({
      success: true,
      message: 'Login successful',
      user: { id: user._id, storeName: user.storeName, phoneNumber: user.phoneNumber },
      token
    });
  } catch (error) {
    console.error('Error in user login:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getUserProfile(req, reply) {
  try {
    const userId = req.user.id;
    const user = await userModel.findUserById(userId);
    
    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found'
      });
    }
    
    return reply.code(200).send({
      success: true,
      user: {
        id: user._id,
        storeName: user.storeName,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};