# Backend Setup & Configuration Guide

## 📋 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── constants/
│   │   └── enums.js              # All enumerations
│   ├── controllers/
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── courseController.js
│   │   ├── classController.js
│   │   ├── notificationController.js
│   │   └── logController.js
│   ├── middleware/
│   │   ├── errorHandler.js        # Global error handling
│   │   ├── asyncHandler.js        # Async error wrapper
│   │   └── logger.js              # Request logging
│   ├── models/
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Course.js
│   │   ├── Class.js
│   │   ├── Notification.js
│   │   └── LogEntry.js
│   ├── routes/
│   │   ├── students.js
│   │   ├── teachers.js
│   │   ├── courses.js
│   │   ├── classes.js
│   │   ├── notifications.js
│   │   └── logs.js
│   ├── utils/
│   │   ├── AppError.js            # Custom error class
│   │   └── crmUtils.js            # Helper functions
│   └── server.js                  # Main server file
├── .env.example                   # Environment variables example
├── .env                           # Environment variables (local)
├── .gitignore
├── package.json
├── README.md
└── API_DOCUMENTATION.md
```

## 🚀 Installation Steps

### 1. Prerequisites
- **Node.js** v16.0 or higher
- **npm** v8.0 or higher
- **MongoDB** v4.4 or higher (Local or Atlas)

### 2. Install Dependencies
```bash
cd backend
npm install
```

**Key Dependencies:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logging
- `dotenv` - Environment variables
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication

### 3. Environment Setup

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/crm_db

# Server
PORT=5000
HOST=localhost
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# JWT (for future auth)
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/crm_db`
5. Update `MONGODB_URI` in `.env`

## 🏃 Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will start on `http://localhost:5000`

## 🔍 Database Models Overview

### Student Model
```javascript
{
  studentId: String (unique, auto-generated),
  registrationNumber: String (unique),
  name: String,
  email: String,
  dateOfEnrollment: Date,
  mobile1: String,
  mobile2: String,
  parentEmailId: String,
  fatherName: String,
  motherName: String,
  parentContact: String,
  grade: String (enumerated),
  schoolName: String,
  address: String,
  status: String (Active|Paused|Completed|Inactive),
  notes: String,
  timestamps: Date
}
```

### Teacher Model
```javascript
{
  teacherId: String (unique, auto-generated),
  name: String,
  email: String (unique),
  mobile: String,
  subjects: [String],
  compensationPerHour: Number,
  compensationPerHourHigh: Number,
  dateOfJoining: Date,
  status: String (Active|Inactive),
  notes: String,
  timestamps: Date
}
```

### Course Model
```javascript
{
  courseId: String (unique, auto-generated),
  studentId: String (ref: Student),
  subject: String,
  teacherId: String (ref: Teacher),
  timeSlot1/2/3: String,
  cycleType: String (6hrs|8hrs|12hrs|16hrs|monthly),
  cycleTargetHours: Number,
  billingRatePerHour: Number,
  billingRatePerHourHigh: Number,
  startDate: Date,
  endDate: Date,
  status: String (Active|Paused|Completed),
  feeStatus: String (NotDue|Due|PartiallyPaid|Paid),
  completedHours: Number,
  lastDueDate: Date,
  timestamps: Date
}
```

### Class Model
```javascript
{
  classId: String (unique, auto-generated),
  studentId: String (ref: Student),
  courseId: String (ref: Course),
  teacherId: String (ref: Teacher),
  startDateTime: Date,
  durationMinutes: Number,
  topicCovered: String,
  activity: String,
  comments: String,
  createdByRole: String (Admin|Teacher),
  status: String (Scheduled|Completed|Cancelled),
  timestamps: Date
}
```

### Notification Model
```javascript
{
  notificationId: String (unique, auto-generated),
  recipientId: String,
  recipientRole: String (Admin|Teacher|Student),
  title: String,
  message: String,
  type: String (INFO|WARNING|SUCCESS|ERROR),
  status: String (Unread|Read),
  relatedObjectType: String,
  relatedObjectId: String,
  timestamp: Date
}
```

### LogEntry Model
```javascript
{
  logId: String (unique, auto-generated),
  timestamp: Date,
  actorUserId: String,
  actorRole: String (Admin|Teacher),
  actionType: String (CREATE|UPDATE|DELETE|LOGIN|NOTIFICATION|EXPORT),
  objectType: String (Teacher|Student|Course|Class|Settings),
  objectId: String,
  before: Mixed,
  after: Mixed,
  ipAddress: String,
  userAgent: String,
  remarks: String,
  timestamps: Date
}
```

## 📝 Available Scripts

```bash
# Development server with nodemon
npm run dev

# Production server
npm start

# Seed database with sample data
npm run seed

# Verify API endpoints
npm run verify

# Run tests (when configured)
npm test
```

## ✨ Key Features

### 1. **Error Handling**
- Custom `AppError` class with proper HTTP status codes
- Global error handler middleware
- Async error wrapper for controllers
- Comprehensive validation

### 2. **Logging & Audit Trail**
- Complete audit logging for all CRUD operations
- Before/after change tracking
- Actor identification
- Object-level change history

### 3. **Data Validation**
- Mongoose schema validation
- Duplicate entry detection
- Class scheduling conflict detection
- Required field validation

### 4. **CRUD Operations**
- Create, Read, Update, Delete
- Bulk operations
- Pagination & filtering
- Statistics and analytics

### 5. **API Features**
- RESTful endpoints
- Query parameters for filtering
- JSON responses with consistent format
- Proper HTTP status codes

## 🔒 Security Considerations

### Implemented
- ✅ Helmet for security headers
- ✅ CORS validation
- ✅ Input validation
- ✅ Error message sanitization
- ✅ Request logging

### To Be Added (Future)
- 🔓 JWT authentication
- 🔓 Role-based access control
- 🔓 Password hashing (bcryptjs installed)
- 🔓 Rate limiting
- 🔓 Data encryption

## 🧪 Testing Endpoints

### Using cURL
```bash
# Get health status
curl http://localhost:5000/health

# Get all students
curl http://localhost:5000/api/students

# Create a student
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "dateOfEnrollment": "2024-01-15",
    "mobile1": "9876543210",
    "parentEmailId": "parent@example.com",
    "fatherName": "Father",
    "motherName": "Mother",
    "parentContact": "9876543209",
    "grade": "10",
    "createdBy": "admin"
  }'
```

### Using Postman
1. Import API collection from API_DOCUMENTATION.md
2. Set environment variables
3. Test each endpoint

### Using Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create requests for each endpoint
3. Save request history

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service or update MONGODB_URI

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:** Change PORT in .env or stop the process using port 5000

### Missing Environment Variables
```
Error: Cannot read property 'split' of undefined
```
**Solution:** Create .env file with all required variables

### Duplicate Key Error
```
MongoError: E11000 duplicate key error
```
**Solution:** Check for duplicate email/ID values

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [REST API Best Practices](https://restfulapi.net/)

## 📧 API Support

For issues or questions:
1. Check API_DOCUMENTATION.md
2. Review error messages
3. Check logs in console/terminal
4. Check MongoDB connection

## 📄 License

ISC

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
