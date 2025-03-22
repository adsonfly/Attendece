const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

const COLLECTION = 'attendance';

async function addAttendance(attendanceData) {
  const db = getDb();
  
  // Check if we already have an attendance record for this employee on this date
  // If so, we'll update it instead of creating a new one
  const date = attendanceData.date || new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existingRecord = await db.collection(COLLECTION).findOne({
    userId: new ObjectId(attendanceData.userId),
    employeeId: attendanceData.employeeId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  
  if (existingRecord) {
    // Update existing record
    await db.collection(COLLECTION).updateOne(
      { _id: existingRecord._id },
      { 
        $set: {
          employeeName: attendanceData.employeeName,
          salaryPerDay: parseFloat(attendanceData.salaryPerDay) || existingRecord.salaryPerDay || 0,
          status: attendanceData.status || existingRecord.status,
          amountTaken: attendanceData.amountTaken || existingRecord.amountTaken || 0,
          updatedAt: new Date()
        }
      }
    );
    return existingRecord._id;
  } else {
    // Create new record
    const result = await db.collection(COLLECTION).insertOne({
      userId: new ObjectId(attendanceData.userId),
      employeeId: attendanceData.employeeId || null,
      employeeName: attendanceData.employeeName,
      salaryPerDay: parseFloat(attendanceData.salaryPerDay) || 0,
      date: date,
      status: attendanceData.status || 'present',
      amountTaken: attendanceData.amountTaken || 0,
      createdAt: new Date()
    });
    return result.insertedId;
  }
}

async function getAttendanceByUserId(userId) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({ userId: new ObjectId(userId) })
    .sort({ date: -1 })
    .toArray();
}

async function getAttendanceByEmployeeId(userId, employeeId) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({ 
      userId: new ObjectId(userId), 
      employeeId: employeeId 
    })
    .sort({ date: -1 })
    .toArray();
}

async function getAttendanceByDate(userId, date) {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.collection(COLLECTION)
    .find({ 
      userId: new ObjectId(userId),
      date: { $gte: startOfDay, $lte: endOfDay }
    })
    .toArray();
}

async function getAttendanceByDateRange(userId, startDate, endDate) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({ 
      userId: new ObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .toArray();
}

async function getAttendanceByEmployeeIdAndDateRange(userId, employeeId, startDate, endDate) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({ 
      userId: new ObjectId(userId),
      employeeId: employeeId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .toArray();
}

async function getEmployeesList(userId) {
  const db = getDb();
  
  // Group by employeeId to get unique employees with their latest attendance
  const employees = await db.collection(COLLECTION).aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $sort: { date: -1 } },
    { $group: {
        _id: "$employeeId",
        employeeName: { $first: "$employeeName" },
        salaryPerDay: { $first: "$salaryPerDay" },
        lastAttendance: { $first: "$date" },
        lastStatus: { $first: "$status" },
        totalPresent: { 
          $sum: { 
            $cond: [{ $eq: ["$status", "present"] }, 1, 0]
          }
        },
        totalHalfDay: { 
          $sum: { 
            $cond: [{ $eq: ["$status", "half-day"] }, 1, 0]
          }
        },
        totalAbsent: { 
          $sum: { 
            $cond: [{ $eq: ["$status", "absent"] }, 1, 0]
          }
        },
        totalAmountTaken: { $sum: "$amountTaken" }
      }
    },
    { $project: {
        _id: 0,
        employeeId: "$_id",
        employeeName: 1,
        salaryPerDay: 1,
        lastAttendance: 1,
        lastStatus: 1,
        totalPresent: 1,
        totalHalfDay: 1,
        totalAbsent: 1,
        totalAmountTaken: 1,
        // Calculate total earnings
        totalEarnings: { 
          $add: [
            { $multiply: ["$totalPresent", "$salaryPerDay"] },
            { $multiply: ["$totalHalfDay", { $divide: ["$salaryPerDay", 2] }] }
          ]
        }
      }
    }
  ]).toArray();
  
  return employees;
}

module.exports = {
  addAttendance,
  getAttendanceByUserId,
  getAttendanceByEmployeeId,
  getAttendanceByDate,
  getAttendanceByDateRange,
  getAttendanceByEmployeeIdAndDateRange,
  getEmployeesList
}; 