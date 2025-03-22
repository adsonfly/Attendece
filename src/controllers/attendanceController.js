const attendanceModel = require('../models/attendance');

async function addAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeName, employeeId, salaryPerDay, status, date, amountTaken } = req.body;
    
    if (!employeeName) {
      return reply.code(400).send({
        success: false,
        message: 'Employee name is required'
      });
    }
    
    const attendanceId = await attendanceModel.addAttendance({
      userId,
      employeeId,
      employeeName,
      salaryPerDay,
      status: status || 'present',
      date: date ? new Date(date) : new Date(),
      amountTaken: parseInt(amountTaken) || 0
    });
    
    return reply.code(201).send({
      success: true,
      message: 'Attendance recorded successfully',
      attendanceId
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { date, month, year } = req.query;
    
    let attendanceRecords;
    
    if (date) {
      attendanceRecords = await attendanceModel.getAttendanceByDate(userId, new Date(date));
    } else if (month && year) {
      // Get attendance for a specific month and year
      const startDate = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
      attendanceRecords = await attendanceModel.getAttendanceByDateRange(userId, startDate, endDate);
    } else {
      attendanceRecords = await attendanceModel.getAttendanceByUserId(userId);
    }
    
    return reply.code(200).send({
      success: true,
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getEmployeeAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId } = req.params;
    const { month, year } = req.query;
    
    if (!employeeId) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    let attendanceRecords;
    
    if (month && year) {
      // Get attendance for a specific month and year
      const startDate = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
      attendanceRecords = await attendanceModel.getAttendanceByEmployeeIdAndDateRange(
        userId, 
        employeeId, 
        startDate, 
        endDate
      );
    } else {
      attendanceRecords = await attendanceModel.getAttendanceByEmployeeId(userId, employeeId);
    }
    
    return reply.code(200).send({
      success: true,
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Error fetching employee attendance records:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getEmployeesList(req, reply) {
  try {
    const userId = req.user.id;
    
    const employees = await attendanceModel.getEmployeesList(userId);
    
    return reply.code(200).send({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees list:', error);
    return reply.code(500).send({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  addAttendance,
  getAttendance,
  getEmployeeAttendance,
  getEmployeesList
}; 