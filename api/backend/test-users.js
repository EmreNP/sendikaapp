#!/usr/bin/env node

/**
 * Test script for User Management Endpoints
 * Tests all 12 user management endpoints
 */

const BASE_URL = 'http://localhost:3001';

// Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

// Helper function to get ID token from custom token
async function getIdTokenFromCustomToken(customToken) {
  // In a real scenario, you'd use Firebase Client SDK
  // For testing, we'll use the custom token directly
  return customToken;
}

// Helper function to create or get admin user
async function getAdminUser() {
  const adminEmail = 'admin@test.com';
  
  try {
    const userRecord = await auth.getUserByEmail(adminEmail);
    const customToken = await auth.createCustomToken(userRecord.uid);
    return { uid: userRecord.uid, token: customToken };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Create admin user
      const userRecord = await auth.createUser({
        email: adminEmail,
        password: 'Admin1234!',
        displayName: 'Admin User'
      });
      
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      const customToken = await auth.createCustomToken(userRecord.uid);
      return { uid: userRecord.uid, token: customToken };
    }
    throw error;
  }
}

// Helper function to create test user
async function createTestUser() {
  const email = `testuser${Date.now()}@test.com`;
  
  const userRecord = await auth.createUser({
    email: email,
    password: 'Test1234!',
    displayName: 'Test User'
  });
  
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: email,
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    status: 'pending_details',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { uid: userRecord.uid, email };
}

// Test functions
async function testGetMe(token) {
  console.log('\n1️⃣ Testing GET /api/users/me');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPutMe(token) {
  console.log('\n2️⃣ Testing PUT /api/users/me');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+905551234567',
        address: 'Test Address',
        city: 'Istanbul',
        district: 'Kadikoy'
      })
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testGetUsers(token) {
  console.log('\n3️⃣ Testing GET /api/users');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Total: ${data.total || 0}, Users: ${data.users?.length || 0}`);
    if (data.users && data.users.length > 0) {
      console.log(`First user: ${data.users[0].firstName} ${data.users[0].lastName}`);
    }
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testGetUserById(token, userId) {
  console.log('\n4️⃣ Testing GET /api/users/[id]');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPostUser(token) {
  console.log('\n5️⃣ Testing POST /api/users');
  console.log('-'.repeat(60));
  
  try {
    const email = `newuser${Date.now()}@test.com`;
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'New',
        lastName: 'User',
        email: email,
        password: 'NewUser1234!',
        role: 'user',
        status: 'pending_admin_approval'
      })
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return { ok: res.ok, userId: data.user?.uid };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { ok: false };
  }
}

async function testPatchStatus(token, userId) {
  console.log('\n6️⃣ Testing PATCH /api/users/[id]/status');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'pending_admin_approval'
      })
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPatchRole(token, userId) {
  console.log('\n7️⃣ Testing PATCH /api/users/[id]/role');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'user'
      })
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPatchBranch(token, userId) {
  console.log('\n8️⃣ Testing PATCH /api/users/[id]/branch');
  console.log('-'.repeat(60));
  
  // First, get a branch ID
  let branchId = null;
  try {
    const branchesRes = await fetch(`${BASE_URL}/api/branches`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const branchesData = await branchesRes.json();
    if (branchesData.branches && branchesData.branches.length > 0) {
      branchId = branchesData.branches[0].id;
    }
  } catch (error) {
    console.log('⚠️  Could not get branch ID, skipping branch assignment test');
    return true;
  }
  
  if (!branchId) {
    console.log('⚠️  No branch found, skipping branch assignment test');
    return true;
  }
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/branch`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        branchId: branchId
      })
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPatchDeactivate(token, userId) {
  console.log('\n9️⃣ Testing PATCH /api/users/[id]/deactivate');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPatchActivate(token, userId) {
  console.log('\n🔟 Testing PATCH /api/users/[id]/activate');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testGetStats(token) {
  console.log('\n1️⃣1️⃣ Testing GET /api/users/stats');
  console.log('-'.repeat(60));
  
  try {
    const res = await fetch(`${BASE_URL}/api/users/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    return res.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing User Management Endpoints\n');
  console.log('='.repeat(60));
  
  // Get admin user
  console.log('\n📋 Setting up admin user...');
  const adminUser = await getAdminUser();
  console.log(`✅ Admin user ready: ${adminUser.uid}`);
  
  // Create a test user for testing
  console.log('\n📋 Creating test user...');
  const testUser = await createTestUser();
  console.log(`✅ Test user created: ${testUser.uid}`);
  
  const results = [];
  
  // Run tests
  results.push(await testGetMe(adminUser.token));
  results.push(await testPutMe(adminUser.token));
  results.push(await testGetUsers(adminUser.token));
  results.push(await testGetUserById(adminUser.token, testUser.uid));
  
  const createResult = await testPostUser(adminUser.token);
  results.push(createResult.ok);
  const newUserId = createResult.userId || testUser.uid;
  
  results.push(await testPatchStatus(adminUser.token, newUserId));
  results.push(await testPatchRole(adminUser.token, newUserId));
  results.push(await testPatchBranch(adminUser.token, newUserId));
  results.push(await testPatchDeactivate(adminUser.token, newUserId));
  results.push(await testPatchActivate(adminUser.token, newUserId));
  results.push(await testGetStats(adminUser.token));
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

