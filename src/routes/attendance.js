const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

function attendanceRoutes(fastify, options, done) {
  // Add attendance record (protected route)
  fastify.post('/add', { onRequest: authenticate }, attendanceController.addAttendance);
  
  // Get attendance records (protected route)
  fastify.get('/records', { onRequest: authenticate }, attendanceController.getAttendance);
  
  // Get employees list (protected route)
  fastify.get('/employees', { onRequest: authenticate }, attendanceController.getEmployeesList);
  
  // Get attendance records for a specific employee (protected route)
  fastify.get('/employee/:employeeId', { onRequest: authenticate }, attendanceController.getEmployeeAttendance);
  
  done();
}

module.exports = attendanceRoutes; 