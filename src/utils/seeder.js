const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Class = require('../models/Class');
const LogEntry = require('../models/LogEntry');

dotenv.config({ path: '../../.env' });

const teachers = [
  {
    teacherId: "TCH-000001",
    name: "Dr. Ananya Sharma",
    email: "ananya@institute.com",
    mobile: "+91 98765 43210",
    subjects: ["Mathematics", "Physics"],
    compensationPerHour: 800,
    compensationPerHourHigh: 1000,
    dateOfJoining: new Date("2024-01-15"),
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    teacherId: "TCH-000002",
    name: "Rajesh Kumar",
    email: "rajesh@institute.com",
    mobile: "+91 98765 43211",
    subjects: ["Chemistry"],
    compensationPerHour: 700,
    dateOfJoining: new Date("2024-03-01"),
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    teacherId: "TCH-000003",
    name: "Priya Patel",
    email: "priya@institute.com",
    mobile: "+91 98765 43212",
    subjects: ["English", "Literature"],
    compensationPerHour: 650,
    dateOfJoining: new Date("2023-09-10"),
    status: "Inactive",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    teacherId: "TCH-000004",
    name: "Vikram Singh",
    email: "vikram@institute.com",
    mobile: "+91 98765 43213",
    subjects: ["Biology", "Chemistry"],
    compensationPerHour: 750,
    compensationPerHourHigh: 900,
    dateOfJoining: new Date("2024-06-01"),
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    teacherId: "TCH-000005",
    name: "Meera Nair",
    email: "meera@institute.com",
    mobile: "+91 98765 43214",
    subjects: ["Computer Science"],
    compensationPerHour: 900,
    dateOfJoining: new Date("2024-02-20"),
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
];

const students = [
  {
    studentId: "STD-000001",
    registrationNumber: "STU-2024-001",
    name: "Arjun Mehta",
    email: "arjun@email.com",
    dateOfEnrollment: new Date("2024-04-01"),
    mobile1: "+91 87654 32100",
    mobile2: "+91 87654 32100",
    parentEmailId: "parent.arjun@email.com",
    grade: "12",
    schoolName: "Delhi Public School",
    address: "New Delhi",
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    studentId: "STD-000002",
    registrationNumber: "STU-2024-002",
    name: "Sneha Reddy",
    email: "sneha@email.com",
    dateOfEnrollment: new Date("2024-05-15"),
    mobile1: "+91 87654 32101",
    parentEmailId: "parent.sneha@email.com",
    grade: "11",
    schoolName: "Nalanda Academy",
    address: "Bangalore",
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    studentId: "STD-000003",
    registrationNumber: "STU-2024-003",
    name: "Karan Gupta",
    email: "karan@email.com",
    dateOfEnrollment: new Date("2024-01-10"),
    mobile1: "+91 87654 32102",
    mobile2: "+91 87654 32102",
    parentEmailId: "parent.karan@email.com",
    grade: "10",
    schoolName: "Central School",
    address: "Mumbai",
    status: "Paused",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    studentId: "STD-000004",
    registrationNumber: "STU-2024-004",
    name: "Divya Joshi",
    email: "divya@email.com",
    dateOfEnrollment: new Date("2024-06-01"),
    mobile1: "+91 87654 32103",
    parentEmailId: "parent.divya@email.com",
    grade: "12",
    schoolName: "Bharati Vidyapith",
    address: "Pune",
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    studentId: "STD-000005",
    registrationNumber: "STU-2024-005",
    name: "Rohan Das",
    email: "rohan@email.com",
    dateOfEnrollment: new Date("2023-08-01"),
    mobile1: "+91 87654 32104",
    parentEmailId: "parent.rohan@email.com",
    grade: "12thPass",
    schoolName: "St. Xavier's",
    address: "Kolkata",
    status: "Completed",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
  {
    studentId: "STD-000006",
    registrationNumber: "STU-2024-006",
    name: "Anita Sharma",
    email: "anita@email.com",
    dateOfEnrollment: new Date("2024-07-01"),
    mobile1: "+91 87654 32105",
    parentEmailId: "parent.anita@email.com",
    grade: "12",
    schoolName: "Delhi Public School",
    address: "New Delhi",
    status: "Active",
    createdBy: "ADM-001",
    updatedBy: "ADM-001",
  },
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db');

    await Teacher.deleteMany();
    await Student.deleteMany();
    await Course.deleteMany();
    await Class.deleteMany();
    await LogEntry.deleteMany();

    await Teacher.insertMany(teachers);
    await Student.insertMany(students);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
