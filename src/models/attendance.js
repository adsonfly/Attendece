const { MongoClient, ObjectId } = require('mongodb');
const config = require('../config');

let db;

async function connect() {
  if (!db) {
    const client = await MongoClient.connect(config.mongoUri);
    db = client.db(config.dbName);
  }
  return db;
}

const COLLECTION = 'attendance';

// Helper function to parse date string (DD-MM-YY format)
function parseDateString(dateStr) {
  const [day, month, year] = dateStr.split('-').map(num => parseInt(num));
  // Convert 2-digit year to 4-digit year (assuming 20xx)
  const fullYear = 2000 + year;
  // Month is 0-based in Date constructor
  return new Date(fullYear, month - 1, day);
}

// Helper function to format date to DD-MM-YY
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

async function getTableData(userId, employeeId, month, year) {
  try {
    const db = await connect();
    
    const result = await db.collection(COLLECTION).findOne({
      userId: new ObjectId(userId),
      employeeId: employeeId,
      month: month,
      year: year,
      type: 'table_data'
    });

    if (!result) {
      return {}; // Return empty object if no data found
    }

    // Convert array format back to object format for frontend
    const formattedData = {};
    if (result.entries && Array.isArray(result.entries)) {
      result.entries.forEach(entry => {
        const dateStr = formatDate(new Date(entry.date));
        formattedData[dateStr] = {
          attendance: entry.attendance === "present" ? "YES" : "NO",
          workTime: entry.workTime,
          amountTaken: entry.amountTaken
        };
      });
    }

    return formattedData;
  } catch (error) {
    console.error('Error in getTableData:', error);
    throw error;
  }
}

async function saveTableData(userId, employeeId, tableData, month, year) {
  try {
    const db = await connect();
    
    // Convert tableData object to array format for MongoDB
    const tableEntries = Object.entries(tableData).map(([dateStr, data]) => ({
      date: parseDateString(dateStr),
      attendance: data.attendance === "YES" ? "present" : "absent",
      workTime: data.workTime,
      amountTaken: parseFloat(data.amountTaken) || 0
    }));

    const result = await db.collection(COLLECTION).updateOne(
      {
        userId: new ObjectId(userId),
        employeeId: employeeId,
        month: month,
        year: year,
        type: 'table_data'
      },
      {
        $set: {
          entries: tableEntries,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return result;
  } catch (error) {
    console.error('Error in saveTableData:', error);
    throw error;
  }
}

async function addAttendance({ userId, employeeName, salaryPerDay }) {
  try {
    const db = await connect();

    // Check if employee already exists
    const existingEmployee = await db.collection(COLLECTION).findOne({
      userId: new ObjectId(userId),
      employeeName: employeeName,
      type: 'employee'
    });

    if (existingEmployee) {
      // Update existing employee
      const result = await db.collection(COLLECTION).updateOne(
        { _id: existingEmployee._id },
        {
          $set: {
            salaryPerDay: salaryPerDay,
            updatedAt: new Date()
          }
        }
      );
      return { ...existingEmployee, salaryPerDay };
    }

    // Create new employee
    const employee = {
      userId: new ObjectId(userId),
      employeeName,
      salaryPerDay,
      type: 'employee',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(employee);
    return { ...employee, _id: result.insertedId };
  } catch (error) {
    console.error('Error in addAttendance:', error);
    throw error;
  }
}

async function getEmployeesList(userId) {
  try {
    const db = await connect();
    const employees = await db.collection(COLLECTION)
      .find({
        userId: new ObjectId(userId),
        type: 'employee'
      })
      .toArray();
    return employees;
  } catch (error) {
    console.error('Error in getEmployeesList:', error);
    throw error;
  }
}

async function getEmployeeAttendance(userId, employeeId) {
  try {
    const db = await connect();
    const records = await db.collection(COLLECTION)
      .find({
        userId: new ObjectId(userId),
        employeeId: employeeId,
        type: 'table_data'
      })
      .sort({ date: -1 })
      .toArray();
    return records;
  } catch (error) {
    console.error('Error in getEmployeeAttendance:', error);
    throw error;
  }
}

async function deleteEmployee(userId, employeeId) {
  try {
    const db = await connect();
    
    // Delete employee record
    const employeeResult = await db.collection(COLLECTION).deleteOne({
      userId: new ObjectId(userId),
      _id: new ObjectId(employeeId),
      type: 'employee'
    });

    // Delete all attendance records
    const attendanceResult = await db.collection(COLLECTION).deleteMany({
      userId: new ObjectId(userId),
      employeeId: employeeId,
      type: 'table_data'
    });

    return {
      employeeDeleted: employeeResult.deletedCount,
      attendanceDeleted: attendanceResult.deletedCount
    };
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    throw error;
  }
}

async function addAttendanceRecord(data) {
  const db = await connect();
  const { userId, employeeId, employeeName, salaryPerDay, status, workTime, date, amountTaken } = data;

  const attendanceDate = new Date(date);
  if (isNaN(attendanceDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const newRecord = {
    userId: new ObjectId(userId),
    employeeId,
    employeeName,
    salaryPerDay: parseFloat(salaryPerDay),
    date: attendanceDate,
    status,
    workTime: workTime || (status === 'present' ? 'FULL' : status === 'half-day' ? 'HALF' : '0'),
    amountTaken: parseFloat(amountTaken) || 0,
    month: attendanceDate.getMonth() + 1,
    year: attendanceDate.getFullYear(),
    createdAt: new Date()
  };

  const result = await db.collection(COLLECTION).insertOne(newRecord);
  return { insertedId: result.insertedId, employeeId };
}

async function getAttendanceByUserId(userId) {
  const db = await connect();
  return db.collection(COLLECTION)
    .find({ 
      userId: new ObjectId(userId)
    })
    .sort({ date: -1 })
    .toArray();
}

async function getAttendanceHistory(userId, month, year) {
  const db = await connect();
  return db.collection(COLLECTION)
    .find({
      userId: new ObjectId(userId),
      month: month,
      year: year
    })
    .sort({ date: -1 })
    .toArray();
}

async function shiftAttendance(userId, employeeId, month, year) {
  const db = await connect();
  
  const records = await db.collection(COLLECTION).find({
    userId: new ObjectId(userId),
    employeeId: employeeId,
    month: month,
    year: year
  }).toArray();

  if (!records || records.length === 0) {
    throw new Error('No records found to shift');
  }

  const totals = records.reduce((acc, record) => {
    if (record.workTime === 'FULL') acc.totalPresent++;
    else if (record.workTime === 'HALF') acc.totalHalfDay++;
    else if (record.workTime === '0') acc.totalAbsent++;
    acc.totalEarnings += record.workTime === 'FULL' ? record.salaryPerDay :
                        record.workTime === 'HALF' ? record.salaryPerDay / 2 : 0;
    return acc;
  }, { totalPresent: 0, totalHalfDay: 0, totalAbsent: 0, totalEarnings: 0 });

  const result = await db.collection(COLLECTION).updateMany(
    {
      userId: new ObjectId(userId),
      employeeId: employeeId,
      month: month,
      year: year
    },
    {
      $set: { 
        shiftedAt: new Date(),
        ...totals
      }
    }
  );

  return result.modifiedCount;
}

async function updateAttendance(userId, employeeId, date, status, workTime) {
  const db = await connect();
  
  const attendanceDate = new Date(date);
  if (isNaN(attendanceDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const existing = await db.collection(COLLECTION).findOne({
    userId: new ObjectId(userId),
    employeeId: employeeId,
    date: attendanceDate
  });

  if (!existing) {
    throw new Error('No attendance record found for this date');
  }

  const result = await db.collection(COLLECTION).updateOne(
    {
      userId: new ObjectId(userId),
      employeeId: employeeId,
      date: attendanceDate
    },
    {
      $set: { 
        status: status,
        workTime: workTime || (status === 'present' ? 'FULL' : status === 'half-day' ? 'HALF' : '0'),
        updatedAt: new Date()
      }
    }
  );

  return result.modifiedCount;
}

module.exports = {
  addAttendance,
  addAttendanceRecord,
  getEmployeesList,
  getEmployeeAttendance,
  deleteEmployee,
  getTableData,
  saveTableData,
  getAttendanceByUserId,
  getAttendanceHistory,
  shiftAttendance,
  updateAttendance
};