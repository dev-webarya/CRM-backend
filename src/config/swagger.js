const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description:
        'Internal CRM API for admins, teachers, and students. All protected endpoints use JWT bearer auth.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },

      // ==== AUTH ====
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email/phone + password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['password'],
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful (returns JWT + user)' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          responses: {
            200: { description: 'Current user' },
            401: { description: 'Not authenticated' },
          },
        },
      },

      // ==== TEACHERS ====
      '/api/teachers': {
        get: {
          tags: ['Teachers'],
          summary: 'List teachers (admin)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated teacher list' } },
        },
        post: {
          tags: ['Teachers'],
          summary: 'Create teacher (admin)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'mobile', 'compensationPerHour', 'dateOfJoining'],
                },
              },
            },
          },
          responses: { 201: { description: 'Teacher created' } },
        },
      },
      '/api/teachers/{id}': {
        get: {
          tags: ['Teachers'],
          summary: 'Get teacher by teacherId (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Teacher' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['Teachers'],
          summary: 'Update teacher (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Teachers'],
          summary: 'Delete teacher (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/api/teachers/me/profile': {
        get: {
          tags: ['Teachers'],
          summary: 'Get logged-in teacher profile (Teacher collection)',
          responses: { 200: { description: 'Teacher profile' } },
        },
      },

      // ==== STUDENTS ====
      '/api/students': {
        get: {
          tags: ['Students'],
          summary: 'List students (admin)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'grade', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated student list' } },
        },
        post: {
          tags: ['Students'],
          summary: 'Create student (admin)',
          requestBody: { required: true },
          responses: { 201: { description: 'Student created' } },
        },
      },
      '/api/students/{id}': {
        get: {
          tags: ['Students'],
          summary: 'Get student by studentId (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Student' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['Students'],
          summary: 'Update student (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Students'],
          summary: 'Delete student (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/api/students/teacher': {
        get: {
          tags: ['Students'],
          summary: 'List students for logged-in teacher',
          responses: { 200: { description: 'Students taught by this teacher' } },
        },
      },

      // ==== COURSES ====
      '/api/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List courses (admin or filtered)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'studentId', in: 'query', schema: { type: 'string' } },
            { name: 'teacherId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Courses' } },
        },
        post: {
          tags: ['Courses'],
          summary: 'Create course (admin)',
          requestBody: { required: true },
          responses: { 201: { description: 'Course created' } },
        },
      },
      '/api/courses/{id}': {
        get: {
          tags: ['Courses'],
          summary: 'Get course by courseId',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Course' } },
        },
        put: {
          tags: ['Courses'],
          summary: 'Update course (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Courses'],
          summary: 'Delete course (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/api/courses/teacher': {
        get: {
          tags: ['Courses'],
          summary: 'List courses for logged-in teacher',
          responses: { 200: { description: 'Teacher courses' } },
        },
      },
      '/api/courses/student': {
        get: {
          tags: ['Courses'],
          summary: 'List courses for logged-in student',
          responses: { 200: { description: 'Student courses' } },
        },
      },

      // ==== CLASSES ====
      '/api/classes': {
        get: {
          tags: ['Classes'],
          summary: 'List classes (admin or filtered)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'studentId', in: 'query', schema: { type: 'string' } },
            { name: 'teacherId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Classes' } },
        },
        post: {
          tags: ['Classes'],
          summary: 'Create class (admin)',
          requestBody: { required: true },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/api/classes/{id}': {
        get: {
          tags: ['Classes'],
          summary: 'Get class by classId',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Class' } },
        },
        put: {
          tags: ['Classes'],
          summary: 'Update class (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Classes'],
          summary: 'Delete class (admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/api/classes/teacher': {
        get: {
          tags: ['Classes'],
          summary: 'List classes for logged-in teacher',
          responses: { 200: { description: 'Teacher classes' } },
        },
      },
      '/api/classes/student': {
        get: {
          tags: ['Classes'],
          summary: 'List classes for logged-in student',
          responses: { 200: { description: 'Student classes' } },
        },
      },
      '/api/classes/{id}/complete': {
        patch: {
          tags: ['Classes'],
          summary: 'Mark class as completed (admin or owning teacher)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Completed' } },
        },
      },
      '/api/classes/{id}/cancel': {
        patch: {
          tags: ['Classes'],
          summary: 'Cancel class (admin or owning teacher)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: false },
          responses: { 200: { description: 'Cancelled' } },
        },
      },

      // ==== CLASS SESSIONS (generic live classes) ====
      '/api/class-sessions': {
        get: {
          tags: ['ClassSessions'],
          summary: 'Get my classes (role-based)',
          responses: { 200: { description: 'Classes for current user' } },
        },
        post: {
          tags: ['ClassSessions'],
          summary: 'Create class session (teacher)',
          requestBody: { required: true },
          responses: { 201: { description: 'Created' } },
        },
      },

      // ==== PAYMENTS ====
      '/api/payments/create-intent': {
        post: {
          tags: ['Payments'],
          summary: 'Create Stripe payment intent',
          requestBody: { required: true },
          responses: { 200: { description: 'Client secret + intent id' } },
        },
      },
      '/api/payments/process': {
        post: {
          tags: ['Payments'],
          summary: 'Record payment (Stripe or manual)',
          requestBody: { required: true },
          responses: { 201: { description: 'Payment recorded' } },
        },
      },
      '/api/payments/my-payments': {
        get: {
          tags: ['Payments'],
          summary: 'List my payments',
          responses: { 200: { description: 'Payments for current user' } },
        },
      },

      // ==== PAYROLL & INVOICES ====
      '/api/payroll/generate-monthly': {
        post: {
          tags: ['Payroll'],
          summary: 'Generate monthly payroll for all teachers (admin)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { billingMonth: { type: 'string', example: '2026-03' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Payroll generated' } },
        },
      },
      '/api/payroll/pending': {
        get: {
          tags: ['Payroll'],
          summary: 'Get pending payrolls (admin)',
          responses: { 200: { description: 'Pending payrolls' } },
        },
      },
      '/api/payroll/teacher': {
        get: {
          tags: ['Payroll'],
          summary: 'Get payroll history for logged-in teacher',
          responses: { 200: { description: 'Teacher payrolls' } },
        },
      },
      '/api/invoices/generate-monthly': {
        post: {
          tags: ['Invoices'],
          summary: 'Generate monthly invoices for all students (admin)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { billingMonth: { type: 'string', example: '2026-03' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Invoices generated' } },
        },
      },
      '/api/invoices/my-invoices': {
        get: {
          tags: ['Invoices'],
          summary: 'Get invoices for current student',
          responses: { 200: { description: 'Invoices' } },
        },
      },
      '/api/invoices/{id}/pay': {
        post: {
          tags: ['Invoices'],
          summary: 'Record payment against invoice',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true },
          responses: { 200: { description: 'Payment recorded' } },
        },
      },

      // ==== LOGS ====
      '/api/logs': {
        get: {
          tags: ['Logs'],
          summary: 'List audit logs (admin)',
          responses: { 200: { description: 'Audit logs' } },
        },
      },

      // ==== NOTIFICATIONS ====
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'List notifications',
          responses: { 200: { description: 'Notifications' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

