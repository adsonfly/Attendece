const attendanceModel = require('../models/attendance');

async function addAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeName, salaryPerDay } = req.body;

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
    return reply.code(200).send({ 
      success: true, 
      message: 'Employee added successfully',
      data: { 
        employeeId: result.employeeId,
        employees 
      }
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to add employee'
    });
  }
}

async function getAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const records = await attendanceModel.getAttendanceByUserId(userId);
    return reply.code(200).send({ 
      success: true, 
      data: { records } 
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Failed to get attendance records' 
    });
  }
}

async function getEmployeesList(req, reply) {
  try {
    const userId = req.user.id;
    const employees = await attendanceModel.getEmployeesList(userId);
    return reply.code(200).send({ 
      success: true, 
      data: { employees } 
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    return reply.code(500).send({ 
      success: false, 
      message: 'Failed to get employees list' 
    });
  }
}

async function getEmployeeAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId } = req.params;

    if (!employeeId) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const records = await attendanceModel.getEmployeeAttendance(userId, employeeId);
    return reply.code(200).send({
      success: true,
      data: { records }
    });
  } catch (error) {
    console.error('Error getting employee attendance:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get employee attendance'
    });
  }
}

async function getAttendanceHistory(req, reply) {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return reply.code(400).send({
        success: false,
        message: 'Month parameter is required'
      });
    }

    const records = await attendanceModel.getAttendanceHistory(userId, month);
    console.log('Attendance history retrieved:', records);
    return reply.code(200).send({
      success: true,
      message: 'History retrieved successfully',
      data: { records }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Failed to get history'
    });
  }
}

async function updateAttendance(req, reply) {
  try {
    const userId = req.user.id;
    const { employeeId, date, status } = req.body;

    if (!employeeId || !date || !status) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID, date and status are required'
      });
    }

    if (!['present', 'absent', 'half-day'].includes(status)) {
      return reply.code(400).send({
        success: false,
        message: 'Status must be present, absent or half-day'
      });
    }

    await attendanceModel.updateAttendance(userId, employeeId, date, status);
    
    // Get updated records
    const employees = await attendanceModel.getEmployeesList(userId);
    const records = await attendanceModel.getEmployeeAttendance(userId, employeeId);

    return reply.code(200).send({
      success: true,
      message: 'Attendance updated successfully',
      data: { 
        employees,
        records
      }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
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

    if (!employeeId) {
      return reply.code(400).send({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const deletedCount = await attendanceModel.deleteEmployee(userId, employeeId);
    
    // Get updated list of employees
    const employees = await attendanceModel.getEmployeesList(userId);
    
    return reply.code(200).send({
      success: true,
      message: 'Employee deleted successfully',
      data: {
        deletedCount,
        employees
      }
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
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

    if (!employeeId || !month) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Employee ID and month are required' 
      });
    }

    const shiftedCount = await attendanceModel.shiftAttendance(userId, employeeId, month);
    const employees = await attendanceModel.getEmployeesList(userId);

    return reply.code(200).send({ 
      success: true, 
      message: `Successfully shifted attendance records`,
      data: { 
        shiftedCount,
        employees 
      }
    });
  } catch (error) {
    console.error('Error shifting attendance:', error);
    return reply.code(500).send({ 
      success: false, 
      message: error.message || 'Failed to shift attendance' 
    });
  }
}

module.exports = {
  addAttendance,
  getAttendance,
  getEmployeesList,
  getEmployeeAttendance,
  getAttendanceHistory,
  updateAttendance,
  deleteEmployee,
  shiftAttendance
};