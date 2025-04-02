const attendanceController = require('../controllers/attendanceController');

async function attendanceRoutes(fastify, options) {
  // Middleware to verify token
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      if (request.routerPath === '/api/attendance/login') return;
      
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('No token provided');
      }
      
      const decoded = await fastify.jwt.verify(token);
      request.user = { id: decoded.id };
    } catch (error) {
      reply.code(401).send({ success: false, message: 'Invalid or expired token' });
    }
  });

  // Add employee
  fastify.post('/add', {
    schema: {
      body: {
        type: 'object',
        required: ['employeeName', 'salaryPerDay'],
        properties: {
          employeeName: { type: 'string' },
          salaryPerDay: { type: 'number' }
        }
      }
    },
    handler: attendanceController.addAttendance
  });

  // Add attendance record
  fastify.post('/record', {
    schema: {
      body: {
        type: 'object',
        required: ['employeeId', 'date', 'status', 'workTime'],
        properties: {
          employeeId: { type: 'string' },
          date: { type: 'string' },
          status: { type: 'string', enum: ['present', 'absent'] },
          workTime: { type: 'string', enum: ['FULL', 'HALF', '0'] },
          amountTaken: { type: 'number' }
        }
      }
    },
    handler: attendanceController.addAttendanceRecord
  });

  // Get all attendance records
  fastify.get('/records', {
    handler: attendanceController.getAttendance
  });

  // Get employees list
  fastify.get('/employees', {
    handler: attendanceController.getEmployeesList
  });

  // Get employee attendance
  fastify.get('/employee/:employeeId', {
    schema: {
      params: {
        type: 'object',
        required: ['employeeId'],
        properties: {
          employeeId: { type: 'string' }
        }
      }
    },
    handler: attendanceController.getEmployeeAttendance
  });

  // Delete employee
  fastify.delete('/employee/:employeeId', {
    schema: {
      params: {
        type: 'object',
        required: ['employeeId'],
        properties: {
          employeeId: { type: 'string' }
        }
      }
    },
    handler: attendanceController.deleteEmployee
  });

  // Get table data
  fastify.get('/table-data/:employeeId', {
    schema: {
      params: {
        type: 'object',
        required: ['employeeId'],
        properties: {
          employeeId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        required: ['month', 'year'],
        properties: {
          month: { type: 'integer', minimum: 1, maximum: 12 },
          year: { type: 'integer', minimum: 2000, maximum: 2100 }
        }
      }
    },
    handler: attendanceController.getTableData
  });

  // Save table data
  fastify.post('/table-data', {
    schema: {
      body: {
        type: 'object',
        required: ['employeeId', 'tableData', 'month', 'year'],
        properties: {
          employeeId: { type: 'string' },
          tableData: { 
            type: 'object',
            additionalProperties: {
              type: 'object',
              required: ['attendance', 'workTime', 'amountTaken'],
              properties: {
                attendance: { type: 'string', enum: ['YES', 'NO'] },
                workTime: { type: 'string', enum: ['FULL', 'HALF', '0'] },
                amountTaken: { type: 'number', minimum: 0 }
              }
            }
          },
          month: { type: 'integer', minimum: 1, maximum: 12 },
          year: { type: 'integer', minimum: 2000, maximum: 2100 }
        }
      }
    },
    handler: attendanceController.saveTableData
  });
}

module.exports = attendanceRoutes;