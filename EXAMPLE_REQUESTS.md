## Example API Requests

### Prerequisites
- Server running: `npm run dev`
- MongoDB running: `mongod`
- Base URL: `http://localhost:5000/api`

---

## 👥 STUDENT ENDPOINTS

### Create Student
```bash
POST /api/students
Content-Type: application/json

{
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "dateOfEnrollment": "2024-01-15",
  "mobile1": "9876543210",
  "mobile2": "9876543211",
  "parentEmailId": "parent@example.com",
  "fatherName": "Rajesh Kumar",
  "motherName": "Priya Kumar",
  "parentContact": "9876543209",
  "grade": "10",
  "schoolName": "Delhi Public School",
  "address": "123 Main Street, Delhi",
  "status": "Active",
  "notes": "Bright student",
  "createdBy": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "status": 201,
  "message": "Student created successfully",
  "data": {
    "studentId": "STD-456789",
    "registrationNumber": "STU-2024-123",
    "name": "Rahul Kumar",
    ...
  }
}
```

### Get All Students (with filters)
```bash
GET /api/students?page=1&limit=10&status=Active&grade=10&search=rahul
```

### Get Student by ID
```bash
GET /api/students/STD-456789
```

### Update Student
```bash
PUT /api/students/STD-456789
Content-Type: application/json

{
  "status": "Paused",
  "mobile1": "9876543212",
  "updatedBy": "admin"
}
```

### Delete Student
```bash
DELETE /api/students/STD-456789

{
  "deletedBy": "admin"
}
```

### Get Student Statistics
```bash
GET /api/students/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 45,
    "statusWise": [
      { "_id": "Active", "count": 35 },
      { "_id": "Paused", "count": 10 }
    ],
    "gradeWise": [
      { "_id": "10", "count": 15 },
      { "_id": "11", "count": 12 },
      { "_id": "12", "count": 18 }
    ]
  }
}
```

---

## 👨‍🏫 TEACHER ENDPOINTS

### Create Teacher
```bash
POST /api/teachers
Content-Type: application/json

{
  "name": "Dr. Sharma",
  "email": "sharma@example.com",
  "mobile": "9876543210",
  "subjects": ["Mathematics", "Physics"],
  "compensationPerHour": 500,
  "compensationPerHourHigh": 600,
  "dateOfJoining": "2023-06-01",
  "status": "Active",
  "notes": "Experienced teacher",
  "createdBy": "admin"
}
```

### Get All Teachers
```bash
GET /api/teachers?page=1&limit=10&status=Active&search=sharma
```

### Update Teacher
```bash
PUT /api/teachers/TCH-789456
Content-Type: application/json

{
  "subjects": ["Mathematics", "Physics", "Chemistry"],
  "compensationPerHour": 550,
  "updatedBy": "admin"
}
```

### Get Teacher Statistics
```bash
GET /api/teachers/stats/overview
```

---

## 📚 COURSE ENDPOINTS

### Create Course
```bash
POST /api/courses
Content-Type: application/json

{
  "studentId": "STD-456789",
  "subject": "Advanced Mathematics",
  "teacherId": "TCH-789456",
  "timeSlot1": "10:00-11:00",
  "timeSlot2": "14:00-15:00",
  "cycleType": "12hrs",
  "cycleTargetHours": 12,
  "billingRatePerHour": 500,
  "billingRatePerHourHigh": 600,
  "startDate": "2024-01-15",
  "status": "Active",
  "feeStatus": "NotDue",
  "completedHours": 0,
  "lastDueDate": "2024-02-15",
  "createdBy": "admin"
}
```

### Get All Courses
```bash
GET /api/courses?page=1&limit=10&status=Active&studentId=STD-456789
```

### Update Course Fee Status
```bash
PATCH /api/courses/CRS-123456/fee-status
Content-Type: application/json

{
  "feeStatus": "Paid",
  "updatedBy": "admin"
}
```

### Update Course
```bash
PUT /api/courses/CRS-123456
Content-Type: application/json

{
  "status": "Completed",
  "completedHours": 12,
  "endDate": "2024-02-15",
  "updatedBy": "admin"
}
```

### Get Course Statistics
```bash
GET /api/courses/stats/overview
```

---

## 📝 CLASS ENDPOINTS

### Create Class
```bash
POST /api/classes
Content-Type: application/json

{
  "studentId": "STD-456789",
  "courseId": "CRS-123456",
  "teacherId": "TCH-789456",
  "startDateTime": "2024-01-20T10:00:00Z",
  "durationMinutes": 60,
  "topicCovered": "Chapter 5 - Quadratic Equations",
  "activity": "Teaching",
  "comments": "Good interaction from student",
  "createdByRole": "Admin",
  "status": "Scheduled",
  "createdBy": "admin"
}
```

### Get All Classes
```bash
GET /api/classes?page=1&limit=10&status=Scheduled&studentId=STD-456789&fromDate=2024-01-01&toDate=2024-01-31
```

### Mark Class as Completed
```bash
PATCH /api/classes/CLS-654321/complete
Content-Type: application/json

{
  "updatedBy": "admin"
}
```

### Cancel Class
```bash
PATCH /api/classes/CLS-654321/cancel
Content-Type: application/json

{
  "reason": "Teacher fell sick",
  "updatedBy": "admin"
}
```

### Get Class Statistics
```bash
GET /api/classes/stats/overview
```

---

## 🔔 NOTIFICATION ENDPOINTS

### Create Notification
```bash
POST /api/notifications
Content-Type: application/json

{
  "recipientId": "TCH-789456",
  "recipientRole": "Teacher",
  "title": "New Class Assignment",
  "message": "You have been assigned a new class with Rahul Kumar",
  "type": "INFO",
  "status": "Unread",
  "relatedObjectType": "Course",
  "relatedObjectId": "CRS-123456"
}
```

### Get All Notifications
```bash
GET /api/notifications?recipientId=TCH-789456&recipientRole=Teacher&status=Unread&page=1&limit=10
```

### Update Notification Status
```bash
PATCH /api/notifications/NOT-123456/status
Content-Type: application/json

{
  "status": "Read"
}
```

### Mark Multiple as Read
```bash
PATCH /api/notifications/bulk/read
Content-Type: application/json

{
  "notificationIds": ["NOT-123456", "NOT-123457", "NOT-123458"]
}
```

### Get Unread Count
```bash
GET /api/notifications/count/unread?recipientId=TCH-789456
```

### Delete Notification
```bash
DELETE /api/notifications/NOT-123456
```

### Clear Old Notifications
```bash
DELETE /api/notifications/bulk/old
Content-Type: application/json

{
  "daysOld": 30
}
```

---

## 📋 LOG/AUDIT ENDPOINTS

### Get All Logs
```bash
GET /api/logs?page=1&limit=20&actorRole=Admin&actionType=CREATE&objectType=Student&fromDate=2024-01-01&toDate=2024-01-31
```

### Get Audit Trail for Student
```bash
GET /api/logs/audit/trail?objectId=STD-456789&objectType=Student
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "logId": "LOG-111111",
      "timestamp": "2024-01-15T10:00:00Z",
      "actorUserId": "admin",
      "actionType": "CREATE",
      "before": null,
      "after": { "name": "Rahul Kumar", ... }
    },
    {
      "logId": "LOG-222222",
      "timestamp": "2024-01-20T14:00:00Z",
      "actorUserId": "admin",
      "actionType": "UPDATE",
      "before": { "status": "Active" },
      "after": { "status": "Paused" }
    }
  ]
}
```

### Get Logs by Actor
```bash
GET /api/logs/actor/admin?page=1&limit=20
```

### Get Logs by Object
```bash
GET /api/logs/object/STD-456789?objectType=Student
```

### Get Log Statistics
```bash
GET /api/logs/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1245,
    "actionTypeWise": [
      { "_id": "CREATE", "count": 300 },
      { "_id": "UPDATE", "count": 800 },
      { "_id": "DELETE", "count": 100 },
      { "_id": "LOGIN", "count": 45 }
    ],
    "objectTypeWise": [
      { "_id": "Student", "count": 400 },
      { "_id": "Teacher", "count": 300 },
      { "_id": "Course", "count": 350 },
      { "_id": "Class", "count": 195 }
    ]
  }
}
```

### Export Logs
```bash
GET /api/logs/export/json?fromDate=2024-01-01&toDate=2024-01-31&actionType=CREATE
```

### Clean Old Logs
```bash
DELETE /api/logs/cleanup
Content-Type: application/json

{
  "daysOld": 90
}
```

---

## ❤️ HEALTH CHECK

### Server Health
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## 📤 Using cURL

### Example 1: Create Student
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "dateOfEnrollment": "2024-01-15",
    "mobile1": "9876543210",
    "parentEmailId": "parent@test.com",
    "fatherName": "Father",
    "motherName": "Mother",
    "parentContact": "9876543209",
    "grade": "10",
    "createdBy": "admin"
  }'
```

### Example 2: Get Students with Filters
```bash
curl "http://localhost:5000/api/students?page=1&limit=10&status=Active"
```

### Example 3: Update Student
```bash
curl -X PUT http://localhost:5000/api/students/STD-456789 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Paused",
    "updatedBy": "admin"
  }'
```

### Example 4: Delete Student
```bash
curl -X DELETE http://localhost:5000/api/students/STD-456789 \
  -H "Content-Type: application/json" \
  -d '{
    "deletedBy": "admin"
  }'
```

---

## 📮 Using Postman

1. **Create Collection**
   - File → New → Collection
   - Name: "CRM API"

2. **Add Requests**
   - Click "Add Request"
   - Name: "Create Student"
   - Method: POST
   - URL: `{{baseUrl}}/api/students`

3. **Set Environment**
   - Add variable: `baseUrl = http://localhost:5000`

4. **Test Each Request**
   - Select request
   - Click Send
   - View Response

---

## ⚠️ Common Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET request successful |
| 201 | Created | POST request successful |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Student ID doesn't exist |
| 409 | Conflict | Duplicate email |
| 422 | Validation Error | Invalid data format |
| 500 | Server Error | Database connection failed |

---

## 🎯 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

**Happy Testing! 🚀**
