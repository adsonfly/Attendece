const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

const COLLECTION = 'attendance';

async function addAttendance(attendanceData) {
  const db = getDb();

  // Generate a unique employee ID
  const employeeId = 'EMP' + Date.now();

  // Create new employee record with default present status
  const newEmployee = {
    userId: new ObjectId(attendanceData.userId),
    employeeId,
    employeeName: attendanceData.employeeName,
    salaryPerDay: parseFloat(attendanceData.salaryPerDay),
    date: new Date(),
    status: 'present',
    month: null,
    createdAt: new Date()
  };

  const result = await db.collection(COLLECTION).insertOne(newEmployee);
  return { insertedId: result.insertedId, employeeId };
}

async function getAttendanceByUserId(userId) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({ 
      userId: new ObjectId(userId),
      month: null
    })
    .sort({ date: -1 })
    .toArray();
}

async function getEmployeesList(userId) {
  const db = getDb();
  return db.collection(COLLECTION).aggregate([
    { 
      $match: { 
        userId: new ObjectId(userId),
        month: null
      } 
    },
    { $sort: { date: -1 } },
    { $group: {
        _id: "$employeeId",
        employeeName: { $first: "$employeeName" },
        employeeId: { $first: "$employeeId" },
        salaryPerDay: { $first: "$salaryPerDay" },
        date: { $first: "$date" },
        status: { $first: "$status" },
        totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        totalHalfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } }
      }
    },
    { $project: {
        _id: 0,
        employeeId: 1,
        employeeName: 1,
        salaryPerDay: 1,
        date: 1,
        status: 1,
        totalPresent: 1,
        totalHalfDay: 1,
        totalAbsent: 1,
        totalEarnings: {
          $add: [
            { $multiply: ["$totalPresent", "$salaryPerDay"] },
            { $multiply: ["$totalHalfDay", { $divide: ["$salaryPerDay", 2] }] }
          ]
        }
      }
    }
  ]).toArray();
}

async function getAttendanceHistory(userId, month) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({
      userId: new ObjectId(userId),
      month: month
    })
    .sort({ date: -1 })
    .toArray();
}

async function getEmployeeAttendance(userId, employeeId) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({
      userId: new ObjectId(userId),
      employeeId: employeeId,
      month: null
    })
    .sort({ date: -1 })
    .toArray();
}

async function deleteEmployee(userId, employeeId) {
  const db = getDb();
  // Delete both current and historical records
  const result = await db.collection(COLLECTION).deleteMany({
    userId: new ObjectId(userId),
    employeeId: employeeId
  });
  return result.deletedCount;
}

async function shiftAttendance(userId, employeeId, month) {
  const db = getDb();
  
  // First check if records exist
  const records = await db.collection(COLLECTION).find({
    userId: new ObjectId(userId),
    employeeId: employeeId,
    month: null
  }).toArray();

  if (!records || records.length === 0) {
    throw new Error('No records found to shift');
  }

  // Calculate totals
  const totals = records.reduce((acc, record) => {
    if (record.status === 'present') acc.totalPresent++;
    else if (record.status === 'half-day') acc.totalHalfDay++;
    else if (record.status === 'absent') acc.totalAbsent++;
    acc.totalEarnings += record.status === 'present' ? record.salaryPerDay :
                        record.status === 'half-day' ? record.salaryPerDay / 2 : 0;
    return acc;
  }, { totalPresent: 0, totalHalfDay: 0, totalAbsent: 0, totalEarnings: 0 });

  // Update records with month and totals
  const result = await db.collection(COLLECTION).updateMany(
    {
      userId: new ObjectId(userId),
      employeeId: employeeId,
      month: null
    },
    {
      $set: { 
        month: month,
        shiftedAt: new Date(),
        ...totals
      }
    }
  );

  return result.modifiedCount;
}

async function updateAttendance(userId, employeeId, date, status) {
  const db = getDb();
  
  // Convert date string to Date object
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Check if attendance already exists for this date
  const existing = await db.collection(COLLECTION).findOne({
    userId: new ObjectId(userId),
    employeeId: employeeId,
    date: attendanceDate,
    month: null
  });

  if (!existing) {
    throw new Error('No attendance record found for this date');
  }

  // Update attendance status
  const result = await db.collection(COLLECTION).updateOne(
    {
      userId: new ObjectId(userId),
      employeeId: employeeId,
      date: attendanceDate,
      month: null
    },
    {
      $set: { 
        status: status,
        updatedAt: new Date()
      }
    }
  );

  return result.modifiedCount;
}

module.exports = {
  addAttendance,
  getAttendanceByUserId,
  getEmployeesList,
  getAttendanceHistory,
  getEmployeeAttendance,
  deleteEmployee,
  shiftAttendance,
  updateAttendance
};