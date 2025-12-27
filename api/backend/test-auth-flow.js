#!/usr/bin/env node

/**
 * Test script for complete auth flow:
 * 1. Create user (register/basic)
 * 2. Complete details (register/details) - needs a branch
 * 3. Assign branch_manager role
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

async function getUserIdToken(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);
    return customToken;
  } catch (error) {
    console.error(`❌ Error getting token for ${email}:`, error.message);
    return null;
  }
}

async function testAuthFlow() {
  console.log('🧪 Testing Complete Auth Flow\n');
  console.log('='.repeat(60));
  
  const email = 'testtest394@gmail.com';
  const password = 'Deneme123';
  
  // Step 1: Check if user exists, if not create
  console.log('\n1️⃣ Step 1: User Registration (Basic)');
  console.log('-'.repeat(60));
  
  let userRecord;
  let uid;
  let customToken;
  
  try {
    userRecord = await auth.getUserByEmail(email);
    uid = userRecord.uid;
    console.log(`✅ User already exists: ${email}`);
    console.log(`   UID: ${uid}`);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`   Role: ${userData.role || 'not set'}`);
      console.log(`   Status: ${userData.status || 'not set'}`);
      console.log(`   BranchId: ${userData.branchId || 'not set'}`);
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`📝 User does not exist, creating new user...`);
      
      try {
        // Create user via API
        const registerResponse = await fetch(`${BASE_URL}/api/auth/register/basic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            email: email,
            password: password,
            birthDate: '1990-01-01',
            gender: 'male'
          })
        });
        
        const registerData = await registerResponse.json();
        console.log(`   Status: ${registerResponse.status}`);
        
        if (registerResponse.ok) {
          uid = registerData.uid;
          customToken = registerData.token || registerData.customToken;
          console.log(`   ✅ User created successfully!`);
          console.log(`   UID: ${uid}`);
          if (customToken) {
            console.log(`   Token received: ${customToken.substring(0, 20)}...`);
          }
        } else {
          console.log(`   ❌ Error: ${registerData.error || 'Unknown error'}`);
          return;
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
        return;
      }
    } else {
      console.log(`   ❌ Error: ${error.message}`);
      return;
    }
  }
  
  // Get token if we don't have it
  if (!customToken && uid) {
    customToken = await getUserIdToken(email);
  }
  
  if (!customToken) {
    console.log('❌ Could not get token, aborting...');
    return;
  }
  
  // Step 2: Check if details are already completed
  console.log('\n2️⃣ Step 2: Check User Details Status');
  console.log('-'.repeat(60));
  
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  
  if (userData?.status === 'pending_branch_review' || 
      userData?.status === 'pending_admin_approval' ||
      userData?.status === 'active') {
    console.log(`✅ Details already completed`);
    console.log(`   Status: ${userData.status}`);
    console.log(`   BranchId: ${userData.branchId || 'not set'}`);
  } else {
    // Step 3: Get or create a branch for details registration
    console.log('\n3️⃣ Step 3: Get/Create Branch for Registration');
    console.log('-'.repeat(60));
    
    let branchId;
    
    // Try to get an active branch
    const branchesSnapshot = await db.collection('branches')
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (!branchesSnapshot.empty) {
      branchId = branchesSnapshot.docs[0].id;
      const branchData = branchesSnapshot.docs[0].data();
      console.log(`✅ Found active branch: ${branchData.name} (${branchId})`);
    } else {
      // Create a test branch
      console.log(`📝 No active branch found, creating test branch...`);
      
      const branchData = {
        name: 'Test Branch',
        code: 'TEST-001',
        city: 'Istanbul',
        district: 'Kadıköy',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const branchRef = await db.collection('branches').add(branchData);
      branchId = branchRef.id;
      console.log(`✅ Created test branch: ${branchId}`);
    }
    
    // Step 4: Complete details registration
    console.log('\n4️⃣ Step 4: Complete Details Registration');
    console.log('-'.repeat(60));
    
    try {
      const detailsResponse = await fetch(`${BASE_URL}/api/auth/register/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customToken}`
        },
        body: JSON.stringify({
          branchId: branchId,
          phone: '05551234567',
          city: 'Istanbul',
          district: 'Kadıköy'
          // TC Kimlik No opsiyonel, geçerli bir format gerektirir
        })
      });
      
      const detailsData = await detailsResponse.json();
      console.log(`   Status: ${detailsResponse.status}`);
      
      if (detailsResponse.ok) {
        console.log(`   ✅ Details registered successfully!`);
        console.log(`   Message: ${detailsData.message}`);
        console.log(`   Status: ${detailsData.user?.status}`);
      } else {
        console.log(`   ❌ Error: ${detailsData.error || 'Unknown error'}`);
        if (detailsData.error?.includes('zaten')) {
          console.log(`   ℹ️  Details might already be registered`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
  
  // Step 5: Assign branch_manager role
  console.log('\n5️⃣ Step 5: Assign Branch Manager Role');
  console.log('-'.repeat(60));
  
  // Get updated user data
  const updatedUserDoc = await db.collection('users').doc(uid).get();
  const updatedUserData = updatedUserDoc.exists ? updatedUserDoc.data() : null;
  
  if (updatedUserData?.role === 'branch_manager') {
    console.log(`✅ User already has branch_manager role`);
    console.log(`   BranchId: ${updatedUserData.branchId || 'not set'}`);
  } else {
    // Get a branch ID if user doesn't have one
    let branchIdForManager = updatedUserData?.branchId;
    
    if (!branchIdForManager) {
      const branchesSnapshot = await db.collection('branches')
        .where('isActive', '==', true)
        .limit(1)
        .get();
      
      if (!branchesSnapshot.empty) {
        branchIdForManager = branchesSnapshot.docs[0].id;
        console.log(`📝 Assigning branch: ${branchIdForManager}`);
      } else {
        console.log(`❌ No active branch found to assign`);
        return;
      }
    }
    
    // Update user role and branchId
    try {
      await db.collection('users').doc(uid).update({
        role: 'branch_manager',
        branchId: branchIdForManager,
        updatedAt: new Date()
      });
      
      console.log(`✅ Branch manager role assigned successfully!`);
      console.log(`   Role: branch_manager`);
      console.log(`   BranchId: ${branchIdForManager}`);
      
      // Get branch name
      const branchDoc = await db.collection('branches').doc(branchIdForManager).get();
      if (branchDoc.exists) {
        console.log(`   Branch Name: ${branchDoc.data().name}`);
      }
    } catch (error) {
      console.log(`   ❌ Error updating user: ${error.message}`);
    }
  }
  
  // Final status
  console.log('\n' + '='.repeat(60));
  console.log('📋 Final User Status:');
  console.log('-'.repeat(60));
  
  const finalUserDoc = await db.collection('users').doc(uid).get();
  if (finalUserDoc.exists) {
    const finalData = finalUserDoc.data();
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${uid}`);
    console.log(`   Name: ${finalData.firstName} ${finalData.lastName}`);
    console.log(`   Role: ${finalData.role || 'not set'}`);
    console.log(`   Status: ${finalData.status || 'not set'}`);
    console.log(`   BranchId: ${finalData.branchId || 'not set'}`);
    
    if (finalData.branchId) {
      const branchDoc = await db.collection('branches').doc(finalData.branchId).get();
      if (branchDoc.exists) {
        console.log(`   Branch Name: ${branchDoc.data().name}`);
      }
    }
  }
  
  console.log('\n✅ Auth flow test completed!\n');
}

// Run tests
testAuthFlow().catch(console.error);

