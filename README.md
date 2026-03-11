# CRM Backend API

This is the backend for the CRM project, built using the MERN stack (MongoDB, Express, React, Node.js).

## Features
- **Teacher Management**: CRUD operations for teachers.
- **Student Management**: CRUD operations for students.
- **Course Management**: CRUD operations for courses.
- **Class Management**: CRUD operations for classes with duplicate detection.
- **Audit Logs**: Tracking all actions performed in the system.
- **Professional Setup**: Includes security middleware (Helmet), request logging (Morgan), and environment variable support.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)

## Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` folder (one has been created for you with defaults):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 3. Seed the Database (Optional)
To populate the database with the initial mock data provided in the frontend:
```bash
npm run seed
```

### 4. Run the Server
Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

| Entity   | Endpoint           | Methods              |
|----------|--------------------|----------------------|
| Teachers | `/api/teachers`    | GET, POST, PUT, DELETE|
| Students | `/api/students`    | GET, POST, PUT, DELETE|
| Courses  | `/api/courses`     | GET, POST, PUT, DELETE|
| Classes  | `/api/classes`     | GET, POST, PUT, DELETE|
| Logs     | `/api/logs`        | GET, POST            |

## Data Models
The backend models are strictly aligned with the frontend interfaces defined in `mockData.ts`.

### Duplicate Class Detection
The backend automatically checks for overlapping classes for the same student and teacher before saving or updating a class, ensuring data integrity.
