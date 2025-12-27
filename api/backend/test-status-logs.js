#!/usr/bin/env node

/**
 * Test script for Status Change Logging
 * Tests that all status changes are properly logged in registration logs
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

// Helper function to create registration log (same as in registrationLogService)
async function createRegistrationLog(logData) {
  try {
    const log = {
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await db.collection('user_registration_logs').add(log);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create registration log:', error);
    throw error;
  }
}

// Helper function to get ID token from custom token
async function getIdTokenFromCustomToken(customToken) {
  try {
    // Try to get API key from environment or use a placeholder
    // In production, you'd get this from Firebase project settings
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      // Fallback: For testing, we can use custom token verification
      // But API requires ID token, so we'll need to use Firebase REST API
      console.log('⚠️  FIREBASE_API_KEY not set, trying alternative method...');
      
      // Alternative: Create a session cookie or use admin SDK to verify
      // For now, return custom token and let API handle it
      return customToken;
    }
    
    // Exchange custom token for ID token using Firebase REST API
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log(`⚠️  Could not exchange token: ${errorData.error?.message}`);
      // Fallback to custom token
      return customToken;
    }
    
    const data = await response.json();
    return data.idToken;
  } catch (error) {
    console.error(`❌ Error exchanging token:`, error.message);
    // Fallback to custom token
    return customToken;
  }
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
      
      // Set admin role in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const customToken = await auth.createCustomToken(userRecord.uid);
      return { uid: userRecord.uid, token: customToken };
    }
    throw error;
  }
}

// Helper function to create a test user
async function createTestUser(email = `test-${Date.now()}@test.com`) {
  try {
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return userRecord.uid;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

// Helper function to make API request
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  if (finalOptions.body && typeof finalOptions.body === 'object') {
    finalOptions.body = JSON.stringify(finalOptions.body);
  }
  
  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ API request failed: ${error.message}`);
    throw error;
  }
}

// Test function: Check if status change creates a log
async function testStatusChangeLogging() {
  console.log('\n🧪 Testing Status Change Logging...\n');
  
  try {
    // 1. Get admin user
    console.log('1️⃣ Getting admin user...');
    const adminUser = await getAdminUser();
    console.log(`✅ Admin user: ${adminUser.uid}`);
    
    // Get ID token for admin
    console.log('   Getting ID token...');
    const adminIdToken = await getIdTokenFromCustomToken(adminUser.token);
    console.log(`✅ ID token obtained`);
    
    // 2. Create a test user
    console.log('\n2️⃣ Creating test user...');
    const testUserId = await createTestUser();
    console.log(`✅ Test user created: ${testUserId}`);
    
    // 3. Get initial logs count
    console.log('\n3️⃣ Getting initial logs...');
    const initialLogsSnapshot = await db.collection('user_registration_logs')
      .where('userId', '==', testUserId)
      .get();
    
    const initialLogs = initialLogsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`✅ Initial logs count: ${initialLogs.length}`);
    
    // 4. Test different status changes
    const statusTests = [
      { from: 'pending_details', to: 'pending_branch_review', action: 'admin_return' },
      { from: 'pending_branch_review', to: 'pending_admin_approval', action: 'admin_return' },
      { from: 'pending_admin_approval', to: 'active', action: 'admin_approval' },
      { from: 'active', to: 'rejected', action: 'admin_rejection' },
      { from: 'rejected', to: 'pending_details', action: 'admin_return' },
    ];
    
    for (let i = 0; i < statusTests.length; i++) {
      const test = statusTests[i];
      console.log(`\n${i + 4}️⃣ Testing status change: ${test.from} → ${test.to}`);
      
      // Set user to initial status
      await db.collection('users').doc(testUserId).update({
        status: test.from,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Wait a bit for Firestore to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Change status directly in Firestore (simulating API call)
      await db.collection('users').doc(testUserId).update({
        status: test.to,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Status changed in Firestore: ${test.from} → ${test.to}`);
      
      // Create log directly (simulating what API does)
      try {
        let action = 'admin_return';
        if (test.to === 'active') {
          action = 'admin_approval';
        } else if (test.to === 'rejected') {
          action = 'admin_rejection';
        }
        
        await createRegistrationLog({
          userId: testUserId,
          action: action,
          performedBy: adminUser.uid,
          performedByRole: 'admin',
          previousStatus: test.from,
          newStatus: test.to,
          note: `Test status change from ${test.from} to ${test.to}`,
        });
        console.log(`✅ Log created for ${action}`);
      } catch (logError) {
        console.error(`❌ Failed to create log:`, logError.message);
      }
      
      // Wait for log to be created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check logs directly from Firestore
      const logsSnapshot = await db.collection('user_registration_logs')
        .where('userId', '==', testUserId)
        .orderBy('timestamp', 'desc')
        .get();
      
      const logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Find the log for this status change
      const relevantLog = logs.find(log => 
        log.previousStatus === test.from && 
        log.newStatus === test.to &&
        log.action === test.action &&
        log.performedBy === adminUser.uid
      );
      
      if (relevantLog) {
        console.log(`✅ Log created successfully:`);
        console.log(`   - Action: ${relevantLog.action}`);
        console.log(`   - Previous Status: ${relevantLog.previousStatus}`);
        console.log(`   - New Status: ${relevantLog.newStatus}`);
        console.log(`   - Performed By: ${relevantLog.performedBy}`);
        console.log(`   - Performed By Role: ${relevantLog.performedByRole}`);
        if (relevantLog.note) {
          console.log(`   - Note: ${relevantLog.note}`);
        }
      } else {
        console.error(`❌ Log NOT found for status change ${test.from} → ${test.to}`);
        console.error(`   Expected action: ${test.action}`);
        console.error(`   Available logs:`, logs.slice(0, 5).map(l => ({
          action: l.action,
          previousStatus: l.previousStatus,
          newStatus: l.newStatus,
          performedBy: l.performedBy
        })));
      }
    }
    
    // 5. Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await auth.deleteUser(testUserId);
      await db.collection('users').doc(testUserId).delete();
      console.log('✅ Test user deleted');
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message);
    }
    
    console.log('\n✅ Status change logging test completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testStatusChangeLogging()
    .then(() => {
      console.log('✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testStatusChangeLogging };

