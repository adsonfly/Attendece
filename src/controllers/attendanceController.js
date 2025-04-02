const attendanceModel = require('../models/attendance');

async function addAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeName, salaryPerDay } = req.body;

    req.log.info(`Adding employee for userId: ${userId}, employeeName: ${employeeName}`);

    if (!employeeName || !salaryPerDay) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Employee name and salary are required' 
      });
    }

    const result = await attendanceModel.addAttendance({
      userId,
      employeeName,
      salaryPerDay
    });

    const employees = await attendanceModel.getEmployeesList(userId);
    req.log.info(`Employee added: ${result.employeeId}, total employees: ${employees.length}`);

    return reply.code(200).send({ 
      success: true, 
      message: 'Employee added successfully',
      data: { 
        employeeId: result.employeeId,
        employees 
      }
    });
  } catch (error) {
    console.error('Error in addAttendance:', error);
    req.log.error(`Error adding employee: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to add employee'
    });
  }
}

async function addAttendanceRecord(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId, employeeName, salaryPerDay, status, workTime, date, amountTaken } = req.body;

    req.log.info(`Adding attendance record for userId: ${userId}, employeeId: ${employeeId}`);

    if (!employeeId || !date || !status || !workTime) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID, date, status, and workTime are required'
      });
    }

    if (!['present', 'absent', 'half-day'].includes(status)) {
      return reply.code(400).send({
        success: false,
        message: 'Status must be present, absent, or half-day'
      });
    }

    if (!['0', 'HALF', 'FULL'].includes(workTime)) {
      return reply.code(400).send({
        success: false,
        message: 'WorkTime must be 0, HALF, or FULL'
      });
    }

    const result = await attendanceModel.addAttendanceRecord({
      userId,
      employeeId,
      employeeName,
      salaryPerDay,
      status,
      workTime,
      date,
      amountTaken
    });

    req.log.info(`Attendance record added: ${result.insertedId}`);

    return reply.code(200).send({
      success: true,
      message: 'Attendance record added successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in addAttendanceRecord:', error);
    req.log.error(`Error adding attendance record: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to add attendance record'
    });
  }
}

async function getTableData(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId } = req.params;
    const { month, year } = req.query;

    req.log.info(`Fetching table data for userId: ${userId}, employeeId: ${employeeId}, month: ${month}, year: ${year}`);

    if (!employeeId || !month || !year) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Employee ID, month, and year are required' 
      });
    }

    const data = await attendanceModel.getTableData(userId, employeeId, parseInt(month), parseInt(year));

    req.log.info(`Retrieved table data for employeeId: ${employeeId}`);

    return reply.code(200).send({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Error in getTableData:', error);
    req.log.error(`Error getting table data: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to get table data'
    });
  }
}

async function saveTableData(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId, tableData, month, year } = req.body;

    req.log.info(`Saving table data for userId: ${userId}, employeeId: ${employeeId}, month: ${month}, year: ${year}`);

    if (!employeeId || !tableData || !month || !year) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Employee ID, table data, month, and year are required' 
      });
    }

    const result = await attendanceModel.saveTableData(userId, employeeId, tableData, month, year);

    req.log.info(`Table data saved for employeeId: ${employeeId}`);

    return reply.code(200).send({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error in saveTableData:', error);
    req.log.error(`Error saving table data: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to save table data'
    });
  }
}

async function getAttendance(req, reply) {
  try {
    const userId = req.user.id;
    req.log.info(`Fetching all attendance records for userId: ${userId}`);

    const records = await attendanceModel.getAttendanceByUserId(userId);
    req.log.info(`Retrieved ${records.length} attendance records`);

    return reply.code(200).send({ 
      success: true, 
      data: { records } 
    });
  } catch (error) {
    console.error('Error in getAttendance:', error);
    req.log.error(`Error getting attendance: ${error.stack}`);
    return reply.code(500).send({ 
      success: false, 
      message: 'Failed to get attendance records' 
    });
  }
}

async function getEmployeesList(req, reply) {
  try {
    const userId = req.user.id;
    req.log.info('Getting employees list for user:', userId);
    
    const employees = await attendanceModel.getEmployeesList(userId);
    req.log.info('Found employees:', employees.length);
    
    return reply.code(200).send({
      success: true,
      message: 'Employees list retrieved successfully',
      data: { employees }
    });
  } catch (error) {
    console.error('Error in getEmployeesList:', error);
    req.log.error(`Error getting employees list: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to get employees list'
    });
  }
}

async function getEmployeeAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId } = req.params;

    req.log.info(`Fetching attendance for userId: ${userId}, employeeId: ${employeeId}`);

    if (!employeeId) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const records = await attendanceModel.getEmployeeAttendance(userId, employeeId);
    req.log.info(`Retrieved ${records.length} records for employeeId: ${employeeId}`);

    return reply.code(200).send({
      success: true,
      data: { records }
    });
  } catch (error) {
    console.error('Error in getEmployeeAttendance:', error);
    req.log.error(`Error getting employee attendance: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to get employee attendance'
    });
  }
}

async function getAttendanceHistory(req, reply) {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    req.log.info(`Fetching attendance history for userId: ${userId}, month: ${month}`);

    if (!month) {
      return reply.code(400).send({
        success: false,
        message: 'Month parameter is required'
      });
    }

    const records = await attendanceModel.getAttendanceHistory(userId, month);
    req.log.info(`Retrieved ${records.length} history records`);

    return reply.code(200).send({
      success: true,
      message: 'History retrieved successfully',
      data: { records }
    });
  } catch (error) {
    console.error('Error in getAttendanceHistory:', error);
    req.log.error(`Error getting history: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to get history'
    });
  }
}

async function updateAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId, date, status, workTime } = req.body;

    req.log.info(`Updating attendance for userId: ${userId}, employeeId: ${employeeId}, date: ${date}`);

    if (!employeeId || !date || !status || !workTime) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID, date, status, and workTime are required'
      });
    }

    if (!['present', 'absent', 'half-day'].includes(status)) {
      return reply.code(400).send({
        success: false,
        message: 'Status must be present, absent, or half-day'
      });
    }

    if (!['0', 'HALF', 'FULL'].includes(workTime)) {
      return reply.code(400).send({
        success: false,
        message: 'WorkTime must be 0, HALF, or FULL'
      });
    }

    await attendanceModel.updateAttendance(userId, employeeId, date, status, workTime);
    
    const employees = await attendanceModel.getEmployeesList(userId);
    const records = await attendanceModel.getEmployeeAttendance(userId, employeeId);

    req.log.info(`Attendance updated successfully for employeeId: ${employeeId}`);

    return reply.code(200).send({
      success: true,
      message: 'Attendance updated successfully',
      data: { 
        employees,
        records
      }
    });
  } catch (error) {
    console.error('Error in updateAttendance:', error);
    req.log.error(`Error updating attendance: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to update attendance'
    });
  }
}

async function deleteEmployee(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId } = req.params;

    req.log.info(`Deleting employee for userId: ${userId}, employeeId: ${employeeId}`);

    if (!employeeId) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const deletedCount = await attendanceModel.deleteEmployee(userId, employeeId);
    const employees = await attendanceModel.getEmployeesList(userId);
    
    req.log.info(`Deleted ${deletedCount} records for employeeId: ${employeeId}`);

    return reply.code(200).send({
      success: true,
      message: 'Employee deleted successfully',
      data: {
        deletedCount,
        employees
      }
    });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    req.log.error(`Error deleting employee: ${error.stack}`);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to delete employee'
    });
  }
}

async function shiftAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId, month } = req.body;

    req.log.info(`Shifting attendance for userId: ${userId}, employeeId: ${employeeId}, month: ${month}`);

    if (!employeeId || !month) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Employee ID and month are required' 
      });
    }

    const shiftedCount = await attendanceModel.shiftAttendance(userId, employeeId, month);
    const employees = await attendanceModel.getEmployeesList(userId);

    req.log.info(`Shifted ${shiftedCount} records to month: ${month}`);

    return reply.code(200).send({ 
      success: true, 
      message: `Successfully shifted attendance records`,
      data: { 
        shiftedCount,
        employees 
      }
    });
  } catch (error) {
    console.error('Error in shiftAttendance:', error);
    req.log.error(`Error shifting attendance: ${error.stack}`);
    return reply.code(500).send({ 
      success: false, 
      message: error.message || 'Failed to shift attendance' 
    });
  }
}

module.exports = {
  addAttendance,
  addAttendanceRecord,
  getAttendance,
  getEmployeesList,
  getEmployeeAttendance,
  getAttendanceHistory,
  updateAttendance,
  deleteEmployee,
  shiftAttendance,
  getTableData,
  saveTableData
};