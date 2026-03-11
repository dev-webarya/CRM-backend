const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- Starting API E2E Verification ---');

  try {
    // 1. Create a Teacher
    console.log('\n[1/6] Testing Teachers API...');
    const teacherRes = await axios.post(`${BASE_URL}/teachers`, {
      name: "Test Teacher",
      email: `test_${Date.now()}@educoach.com`,
      mobile: "+91 99999 99999",
      subjects: ["Subject 1"],
      compensationPerHour: 1000,
      dateOfJoining: new Date(),
    });
    console.log('SUCCESS: Created Teacher', teacherRes.data.teacherId);

    // 2. Create a Student
    console.log('\n[2/6] Testing Students API...');
    const studentRes = await axios.post(`${BASE_URL}/students`, {
      name: "Test Student",
      mobile1: "+91 88888 88888",
      parentEmailId: "parent@test.com",
      fatherName: "Test Father",
      motherName: "Test Mother",
      parentContact: "+91 88888 88888",
      grade: "12",
      dateOfEnrollment: new Date(),
    });
    console.log('SUCCESS: Created Student', studentRes.data.studentId);

    // 3. Create a Course
    console.log('\n[3/6] Testing Courses API...');
    const courseRes = await axios.post(`${BASE_URL}/courses`, {
      studentId: studentRes.data.studentId,
      teacherId: teacherRes.data.teacherId,
      subject: "Course 1 - Subject 1",
      cycleType: "12hrs",
      billingRatePerHour: 1200,
      startDate: new Date(),
    });
    console.log('SUCCESS: Created Course', courseRes.data.courseId);

    // 4. Create a Class
    console.log('\n[4/6] Testing Classes API...');
    const classRes = await axios.post(`${BASE_URL}/classes`, {
      studentId: studentRes.data.studentId,
      teacherId: teacherRes.data.teacherId,
      courseId: courseRes.data.courseId,
      startDateTime: new Date(Date.now() + 86400000), // tomorrow
      durationMinutes: 60,
      createdByRole: "Admin",
    });
    console.log('SUCCESS: Created Class', classRes.data.classId);

    // 5. Create a Notification
    console.log('\n[5/6] Testing Notifications API...');
    const notifRes = await axios.post(`${BASE_URL}/notifications`, {
      recipientId: teacherRes.data.teacherId,
      recipientRole: "Teacher",
      title: "New Class Assigned",
      message: `You have a new class assigned for ${studentRes.data.name}`,
      type: "INFO",
      relatedObjectType: "Class",
      relatedObjectId: classRes.data.classId
    });
    console.log('SUCCESS: Created Notification', notifRes.data.notificationId);

    // 6. Fetch Logs
    console.log('\n[6/6] Testing Logs API...');
    const logsRes = await axios.get(`${BASE_URL}/logs`);
    console.log('SUCCESS: Fetched Logs Count:', logsRes.data.length);

    console.log('\n--- ALL APIs ARE WORKING PROPERLY ---');
  } catch (error) {
    console.error('ERROR during API verification:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

runTests();
