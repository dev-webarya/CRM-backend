const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Admin credentials from seeder
const adminEmail = 'admin@example.com';
const adminPassword = 'admin99';

let adminToken = null;
let teacherId = null;

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  try {
    console.log('\n=== APPROVAL WORKFLOW TEST ===\n');

    // Step 1: Admin Login
    console.log('1️⃣  Admin Login...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    
    if (loginRes.status !== 200) {
      console.error('❌ Admin login failed:', loginRes.data);
      return;
    }
    
    adminToken = loginRes.data.token;
    console.log('✅ Admin logged in');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);

    // Step 2: Register a Teacher
    console.log('\n2️⃣  Register Teacher...');
    const regRes = await makeRequest('POST', '/auth/register', {
      name: 'Test Teacher',
      email: 'teacher_test_' + Date.now() + '@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      phone: '9876543210',
      role: 'teacher',
      hourlyRate: 500
    });

    if (regRes.status !== 201) {
      console.error('❌ Teacher registration failed:', regRes.data);
      return;
    }

    teacherId = regRes.data.user._id;
    console.log('✅ Teacher registered');
    console.log(`   ID: ${teacherId}`);
    console.log(`   Email: ${regRes.data.user.email}`);
    console.log(`   isApproved: ${regRes.data.user.isApproved}`);

    // Step 3: Get Pending Approvals
    console.log('\n3️⃣  Fetch Pending Approvals...');
    const approvalsRes = await makeRequest('GET', '/auth/admin/pending-approvals', null, adminToken);

    if (approvalsRes.status !== 200) {
      console.error('❌ Failed to fetch pending approvals:', approvalsRes.data);
      return;
    }

    console.log('✅ Pending approvals fetched');
    console.log(`   Count: ${approvalsRes.data.count}`);
    
    if (approvalsRes.data.data && approvalsRes.data.data.length > 0) {
      console.log('   Pending Users:');
      approvalsRes.data.data.forEach(user => {
        console.log(`     - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('   ⚠️  No pending users found!');
    }

    // Step 4: Approve the Teacher
    if (teacherId) {
      console.log('\n4️⃣  Approve Teacher...');
      const approveRes = await makeRequest('POST', `/auth/admin/approve/${teacherId}`, {}, adminToken);

      if (approveRes.status !== 200) {
        console.error('❌ Failed to approve teacher:', approveRes.data);
        return;
      }

      console.log('✅ Teacher approved');
      console.log(`   isApproved: ${approveRes.data.user.isApproved}`);
      console.log(`   approvedAt: ${approveRes.data.user.approvedAt}`);

      // Step 5: Verify no pending users
      console.log('\n5️⃣  Verify Pending Approvals (should be empty)...');
      const verifyRes = await makeRequest('GET', '/auth/admin/pending-approvals', null, adminToken);

      if (verifyRes.status !== 200) {
        console.error('❌ Failed to fetch pending approvals:', verifyRes.data);
        return;
      }

      console.log('✅ Verified - Pending approvals list');
      console.log(`   Count: ${verifyRes.data.count}`);

      if (verifyRes.data.count === 0) {
        console.log('   ✅ Teacher successfully approved and removed from pending list!');
      }
    }

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

runTests();
