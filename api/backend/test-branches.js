#!/usr/bin/env node

/**
 * Test script for Branch CRUD endpoints
 * Tests all branch endpoints with two different users
 */

const BASE_URL = 'http://localhost:3001';

// Firebase Admin SDK for getting ID tokens
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
    console.error('Make sure serviceAccountKey.json exists in api/backend directory');
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

async function getUserIdToken(email, password) {
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Create custom token
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // Exchange custom token for ID token using Firebase REST API
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY || 'YOUR_API_KEY'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    });
    
    if (!response.ok) {
      // Fallback: Use custom token directly (works in development mode)
      console.log(`⚠️  Using custom token for ${email} (development mode)`);
      return customToken;
    }
    
    const data = await response.json();
    return data.idToken;
  } catch (error) {
    console.error(`❌ Error getting token for ${email}:`, error.message);
    // Try to create custom token as fallback
    try {
      const userRecord = await auth.getUserByEmail(email);
      const customToken = await auth.createCustomToken(userRecord.uid);
      console.log(`⚠️  Using custom token for ${email} (fallback)`);
      return customToken;
    } catch (err) {
      console.error(`❌ Could not create custom token:`, err.message);
      return null;
    }
  }
}

async function testBranches() {
  console.log('🧪 Testing Branch CRUD Endpoints\n');
  console.log('='.repeat(60));
  
  const users = [
    { email: 'emreozdemir394@gmail.com', password: 'deneme123', name: 'User 1' },
    { email: 'emreozdemr394@gmail.com', password: 'deneme123', name: 'User 2' }
  ];
  
  for (const user of users) {
    console.log(`\n👤 Testing with ${user.name} (${user.email})`);
    console.log('-'.repeat(60));
    
    // Get user token
    const token = await getUserIdToken(user.email, user.password);
    if (!token) {
      console.log(`❌ Could not get token for ${user.email}, skipping...\n`);
      continue;
    }
    
    // Get user info to check role
    let userRole = 'unknown';
    try {
      const userRecord = await auth.getUserByEmail(user.email);
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        userRole = userDoc.data().role || 'unknown';
        console.log(`📋 User Role: ${userRole}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not get user role: ${error.message}`);
    }
    
    // Test 1: GET /api/branches
    console.log('\n1️⃣ Testing GET /api/branches');
    try {
      const response = await fetch(`${BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        console.log(`   ✅ Success! Found ${data.branches?.length || 0} branches`);
        if (data.branches && data.branches.length > 0) {
          const firstBranch = data.branches[0];
          console.log(`   📌 First branch: ${firstBranch.name} (ID: ${firstBranch.id})`);
          if (firstBranch.managers) {
            console.log(`   👥 Managers: ${firstBranch.managers.length}`);
          }
        }
      } else {
        console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    // Test 2: POST /api/branches (only for admin)
    if (userRole === 'admin') {
      console.log('\n2️⃣ Testing POST /api/branches (Create Branch)');
      try {
        const testBranchName = `Test Branch ${Date.now()}`;
        const response = await fetch(`${BASE_URL}/api/branches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: testBranchName,
            code: `TEST-${Date.now()}`,
            city: 'Istanbul',
            district: 'Kadıköy',
            phone: '02161234567',
            email: `test${Date.now()}@example.com`
          })
        });
        
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
          console.log(`   ✅ Success! Created branch: ${data.branch?.name}`);
          console.log(`   📌 Branch ID: ${data.branch?.id}`);
          
          // Store branch ID for later tests
          user.testBranchId = data.branch?.id;
          
          // Test 3: GET /api/branches/[id]
          if (data.branch?.id) {
            console.log('\n3️⃣ Testing GET /api/branches/[id]');
            try {
              const getResponse = await fetch(`${BASE_URL}/api/branches/${data.branch.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const getData = await getResponse.json();
              console.log(`   Status: ${getResponse.status}`);
              if (getResponse.ok) {
                console.log(`   ✅ Success! Branch: ${getData.branch?.name}`);
                if (getData.branch?.managers) {
                  console.log(`   👥 Managers: ${getData.branch.managers.length}`);
                }
              } else {
                console.log(`   ❌ Error: ${getData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.log(`   ❌ Request failed: ${error.message}`);
            }
            
            // Test 4: PUT /api/branches/[id]
            console.log('\n4️⃣ Testing PUT /api/branches/[id] (Update Branch)');
            try {
              const updateResponse = await fetch(`${BASE_URL}/api/branches/${data.branch.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: `${testBranchName} (Updated)`,
                  city: 'Ankara',
                  district: 'Çankaya'
                })
              });
              
              const updateData = await updateResponse.json();
              console.log(`   Status: ${updateResponse.status}`);
              if (updateResponse.ok) {
                console.log(`   ✅ Success! Updated branch: ${updateData.branch?.name}`);
                console.log(`   📍 New city: ${updateData.branch?.city}`);
              } else {
                console.log(`   ❌ Error: ${updateData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.log(`   ❌ Request failed: ${error.message}`);
            }
            
            // Test 5: DELETE /api/branches/[id] (soft delete)
            console.log('\n5️⃣ Testing DELETE /api/branches/[id] (Soft Delete)');
            try {
              const deleteResponse = await fetch(`${BASE_URL}/api/branches/${data.branch.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const deleteData = await deleteResponse.json();
              console.log(`   Status: ${deleteResponse.status}`);
              if (deleteResponse.ok) {
                console.log(`   ✅ Success! ${deleteData.message || 'Branch deleted'}`);
              } else {
                console.log(`   ❌ Error: ${deleteData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.log(`   ❌ Request failed: ${error.message}`);
            }
          }
        } else {
          console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    } else {
      console.log('\n2️⃣ Skipping POST /api/branches (Admin only)');
      console.log('3️⃣ Skipping GET /api/branches/[id] (No branch ID)');
      console.log('4️⃣ Skipping PUT /api/branches/[id] (Admin only)');
      console.log('5️⃣ Skipping DELETE /api/branches/[id] (Admin only)');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

// Run tests
testBranches().catch(console.error);

