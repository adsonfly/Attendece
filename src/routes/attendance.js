const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

function attendanceRoutes(fastify, options, done) {
  // Add employee with attendance
  fastify.post('/add', { 
    onRequest: authenticate 
  }, attendanceController.addAttendance);

  // Get all attendance records
  fastify.get('/records', { 
    onRequest: authenticate 
  }, attendanceController.getAttendance);

  // Get all employees
  fastify.get('/employees', { 
    onRequest: authenticate 
  }, attendanceController.getEmployeesList);

  // Get specific employee's attendance
  fastify.get('/employee/:employeeId/attendance', {
    onRequest: authenticate
  }, attendanceController.getEmployeeAttendance);

  // Get attendance history by month
  fastify.get('/history', {
    onRequest: authenticate
  }, attendanceController.getAttendanceHistory);

  // Update attendance status
  fastify.put('/attendance', {
    onRequest: authenticate
  }, attendanceController.updateAttendance);

  // Delete employee
  fastify.delete('/employee/:employeeId', { 
    onRequest: authenticate 
  }, attendanceController.deleteEmployee);

  // Shift attendance to history
  fastify.post('/shift', { 
    onRequest: authenticate 
  }, attendanceController.shiftAttendance);

  done();
}

module.exports = attendanceRoutes;