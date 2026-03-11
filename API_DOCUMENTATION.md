# CRM API Documentation

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- npm

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create .env file:**
Copy `.env.example` to `.env` and update with your values:
```
MONGODB_URI=mongodb://localhost:27017/crm_db
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

3. **Create MongoDB database:**
```bash
# For local MongoDB
mongod
```

4. **Start the server:**
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

Server will run on `http://localhost:5000`

---

## API Endpoints

### Base URL
```
http://localhost:5000
```

### Response Format
All endpoints return JSON responses in this format:
```json
{
  "success": true|false,
  "status": 200,
  "message": "Operation message",
  "data": { ... },
  "pagination": { "total": 10, "page": 1, "limit": 10, "pages": 1 }
}
```

---

## STUDENTS API

### Get All Students
```
GET /api/students
Query Parameters:
  - page (default: 1)
  - limit (default: 10)
  - status (Active|Paused|Completed|Inactive)
  - grade (6|7|8|9|10|11|12|12thPass|UG|FreshGrad|Professional)
  - search (name|studentId|registrationNumber|email)
```

### Get Student by ID
```
GET /api/students/:id
```

### Create Student
```
POST /api/students
Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "dateOfEnrollment": "2024-01-15",
  "mobile1": "9876543210",
  "mobile2": "9876543211",
  "parentEmailId": "parent@example.com",
  "fatherName": "Father Name",
  "motherName": "Mother Name",
  "parentContact": "9876543209",
  "grade": "10",
  "schoolName": "School Name",
  "address": "123 Main St",
  "createdBy": "admin"
}
```

### Update Student
```
PUT /api/students/:id
Body: (Any fields to update)
{
  "name": "Updated Name",
  "status": "Active",
  "updatedBy": "admin"
}
```

### Delete Student
```
DELETE /api/students/:id
Body:
{
  "deletedBy": "admin"
}
```

### Bulk Update Status
```
PATCH /api/students/bulk/status
Body:
{
  "studentIds": ["STD-123456", "STD-123457"],
  "status": "Paused",
  "updatedBy": "admin"
}
```

### Get Student Statistics
```
GET /api/students/stats/overview
```

---

## TEACHERS API

### Get All Teachers
```
GET /api/teachers
Query Parameters:
  - page (default: 1)
  - limit (default: 10)
  - status (Active|Inactive)
  - search (name|teacherId|email)
```

### Get Teacher by ID
```
GET /api/teachers/:id
```

### Create Teacher
```
POST /api/teachers
Body:
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "mobile": "9876543210",
  "subjects": ["Math", "Science"],
  "compensationPerHour": 500,
  "compensationPerHourHigh": 600,
  "dateOfJoining": "2023-06-01",
  "createdBy": "admin"
}
```

### Update Teacher
```
PUT /api/teachers/:id
Body:
{
  "email": "newemail@example.com",
  "subjects": ["Math"],
  "compensationPerHour": 550,
  "updatedBy": "admin"
}
```

### Delete Teacher
```
DELETE /api/teachers/:id
Body:
{
  "deletedBy": "admin"
}
```

### Get Teacher Statistics
```
GET /api/teachers/stats/overview
```

---

## COURSES API

### Get All Courses
```
GET /api/courses
Query Parameters:
  - page (default: 1)
  - limit (default: 10)
  - status (Active|Paused|Completed)
  - studentId
  - teacherId
  - search (courseId|subject)
```

### Get Course by ID
```
GET /api/courses/:id
```

### Create Course
```
POST /api/courses
Body:
{
  "studentId": "STD-123456",
  "subject": "Mathematics",
  "teacherId": "TCH-654321",
  "timeSlot1": "10:00-11:00",
  "timeSlot2": "14:00-15:00",
  "cycleType": "12hrs",
  "cycleTargetHours": 12,
  "billingRatePerHour": 500,
  "billingRatePerHourHigh": 600,
  "startDate": "2024-01-15",
  "createdBy": "admin"
}
```

### Update Course
```
PUT /api/courses/:id
Body:
{
  "subject": "Advanced Math",
  "status": "Active",
  "updatedBy": "admin"
}
```

### Update Course Fee Status
```
PATCH /api/courses/:id/fee-status
Body:
{
  "feeStatus": "Paid|Due|PartiallyPaid|NotDue",
  "updatedBy": "admin"
}
```

### Delete Course
```
DELETE /api/courses/:id
Body:
{
  "deletedBy": "admin"
}
```

### Get Course Statistics
```
GET /api/courses/stats/overview
```

---

## CLASSES API

### Get All Classes
```
GET /api/classes
Query Parameters:
  - page (default: 1)
  - limit (default: 10)
  - status (Scheduled|Completed|Cancelled)
  - studentId
  - teacherId
  - fromDate (ISO date)
  - toDate (ISO date)
```

### Get Class by ID
```
GET /api/classes/:id
```

### Create Class
```
POST /api/classes
Body:
{
  "studentId": "STD-123456",
  "courseId": "CRS-123456",
  "teacherId": "TCH-654321",
  "startDateTime": "2024-01-15T10:00:00Z",
  "durationMinutes": 60,
  "topicCovered": "Chapter 5 - Quadratic Equations",
  "activity": "Teaching",
  "comments": "Good session",
  "createdByRole": "Admin|Teacher",
  "createdBy": "admin"
}
```

### Update Class
```
PUT /api/classes/:id
Body:
{
  "topicCovered": "Updated topic",
  "comments": "Updated comments",
  "status": "Scheduled",
  "updatedBy": "admin"
}
```

### Mark Class as Completed
```
PATCH /api/classes/:id/complete
Body:
{
  "updatedBy": "admin"
}
```

### Cancel Class
```
PATCH /api/classes/:id/cancel
Body:
{
  "reason": "Cancellation reason",
  "updatedBy": "admin"
}
```

### Delete Class
```
DELETE /api/classes/:id
Body:
{
  "deletedBy": "admin"
}
```

### Get Class Statistics
```
GET /api/classes/stats/overview
```

---

## NOTIFICATIONS API

### Get All Notifications
```
GET /api/notifications
Query Parameters:
  - recipientId
  - recipientRole (Admin|Teacher|Student)
  - status (Unread|Read)
  - type (INFO|WARNING|SUCCESS|ERROR)
  - page (default: 1)
  - limit (default: 10)
```

### Get Notification by ID
```
GET /api/notifications/:id
```

### Create Notification
```
POST /api/notifications
Body:
{
  "recipientId": "user123",
  "recipientRole": "Teacher",
  "title": "New Class Assigned",
  "message": "You have been assigned a new class",
  "type": "INFO|WARNING|SUCCESS|ERROR",
  "relatedObjectType": "Teacher|Student|Course|Class|General",
  "relatedObjectId": "STD-123456"
}
```

### Update Notification Status
```
PATCH /api/notifications/:id/status
Body:
{
  "status": "Read|Unread"
}
```

### Mark Multiple as Read
```
PATCH /api/notifications/bulk/read
Body:
{
  "notificationIds": ["NOT-123456", "NOT-123457"]
}
```

### Get Unread Count
```
GET /api/notifications/count/unread
Query Parameters:
  - recipientId (optional)
  - recipientRole (optional)
```

### Delete Notification
```
DELETE /api/notifications/:id
```

### Clear Old Notifications
```
DELETE /api/notifications/bulk/old
Body:
{
  "daysOld": 30
}
```

---

## LOGS API (Audit Trail)

### Get All Logs
```
GET /api/logs
Query Parameters:
  - page (default: 1)
  - limit (default: 20)
  - actorRole (Admin|Teacher)
  - actionType (CREATE|UPDATE|DELETE|LOGIN|NOTIFICATION|EXPORT)
  - objectType (Teacher|Student|Course|Class|Settings)
  - fromDate (ISO date)
  - toDate (ISO date)
```

### Get Log by ID
```
GET /api/logs/:id
```

### Get Logs for Object
```
GET /api/logs/object/:objectId
Query Parameters:
  - objectType (required)
```

### Get Logs by Actor
```
GET /api/logs/actor/:actorUserId
Query Parameters:
  - page (default: 1)
  - limit (default: 20)
```

### Get Audit Trail
```
GET /api/logs/audit/trail
Query Parameters:
  - objectId (required)
  - objectType (required)
```

### Get Log Statistics
```
GET /api/logs/stats/overview
```

### Export Logs
```
GET /api/logs/export/json
Query Parameters:
  - fromDate
  - toDate
  - actionType
  - objectType
```

### Delete Old Logs
```
DELETE /api/logs/cleanup
Body:
{
  "daysOld": 90
}
```

---

## Health Check

### Server Health
```
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "status": 400,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Common Error Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate)
- `422` - Validation Error
- `500` - Internal Server Error

---

## MongoDB Connection String Examples

### Local
```
mongodb://localhost:27017/crm_db
```

### MongoDB Atlas
```
mongodb+srv://username:password@cluster.mongodb.net/crm_db?retryWrites=true&w=majority
```

---

## Features

✅ **Complete CRUD Operations** - All entities fully supported
✅ **Pagination** - Efficient data pagination
✅ **Filtering & Search** - Advanced filtering capabilities
✅ **Audit Logging** - Complete audit trail
✅ **Error Handling** - Comprehensive error handling
✅ **Validation** - Input validation
✅ **Duplicate Detection** - Prevents scheduling conflicts
✅ **Statistics** - Built-in analytics endpoints
✅ **Notifications** - Push notification system
✅ **Production Ready** - Proper middleware, logging, and security

---

## Testing Example Requests

### Create a Student
```bash
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

### Get All Students
```bash
curl http://localhost:5000/api/students?page=1&limit=10
```

### Update a Student
```bash
curl -X PUT http://localhost:5000/api/students/STD-123456 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Paused",
    "updatedBy": "admin"
  }'
```

---

## License
ISC
