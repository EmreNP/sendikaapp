#!/usr/bin/env node

/**
 * Test script for new auth endpoints:
 * A3: /api/auth/verify-email/send (POST, Authenticated)
 * A4: /api/auth/verify-email/confirm (POST, Public)
 * A5: /api/auth/password/change (POST, Authenticated)
 * A6: /api/auth/password/reset-request (POST, Public)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

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

const auth = admin.auth();

async function getCustomToken(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);
    return customToken;
  } catch (error) {
    console.error(`❌ Error getting token for ${email}:`, error.message);
    return null;
  }
}

async function testEndpoint(name, method, url, headers = {}, body = null) {
  console.log(`\n${name}`);
  console.log('-'.repeat(60));
  console.log(`Method: ${method}`);
  console.log(`URL: ${url}`);
  
  if (body) {
    console.log(`Body: ${JSON.stringify(body, null, 2)}`);
  }
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing New Auth Endpoints\n');
  console.log('='.repeat(60));
  
  // Test email (create if doesn't exist)
  const testEmail = 'test-auth@example.com';
  const testPassword = 'Test123456';
  let testUid;
  let testToken;
  
  // Setup: Create test user if doesn't exist
  console.log('\n📋 Setup: Creating test user if needed...');
  console.log('-'.repeat(60));
  
  try {
    const userRecord = await auth.getUserByEmail(testEmail);
    testUid = userRecord.uid;
    console.log(`✅ Test user exists: ${testEmail}`);
    console.log(`   UID: ${testUid}`);
    
    // Ensure email is not verified for testing
    if (userRecord.emailVerified) {
      await auth.updateUser(testUid, { emailVerified: false });
      console.log(`   ⚠️  Email verified status reset to false for testing`);
    }
    
    testToken = await getCustomToken(testEmail);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`📝 Creating test user...`);
      
      try {
        const userRecord = await auth.createUser({
          email: testEmail,
          password: testPassword,
          displayName: 'Test User',
          emailVerified: false
        });
        
        testUid = userRecord.uid;
        testToken = await getCustomToken(testEmail);
        
        console.log(`✅ Test user created: ${testUid}`);
      } catch (createError) {
        console.error(`❌ Failed to create test user:`, createError.message);
        process.exit(1);
      }
    } else {
      console.error(`❌ Error:`, error.message);
      process.exit(1);
    }
  }
  
  if (!testToken) {
    console.error('❌ Failed to get test token');
    process.exit(1);
  }
  
  console.log(`\n✅ Setup complete!`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   UID: ${testUid}`);
  console.log(`   Token: ${testToken.substring(0, 20)}...`);
  
  // Test A3: /api/auth/verify-email/send (POST, Authenticated)
  await testEndpoint(
    'A3: /api/auth/verify-email/send',
    'POST',
    `${BASE_URL}/api/auth/verify-email/send`,
    {
      'Authorization': `Bearer ${testToken}`
    }
  );
  
  // Test A4: /api/auth/verify-email/confirm (POST, Public)
  // Note: In real scenario, client-side would verify action code first
  // For testing, we'll directly mark email as verified
  await testEndpoint(
    'A4: /api/auth/verify-email/confirm',
    'POST',
    `${BASE_URL}/api/auth/verify-email/confirm`,
    {},
    {
      uid: testUid
    }
  );
  
  // Verify email is now verified
  try {
    const userRecord = await auth.getUser(testUid);
    console.log(`\n✅ Email verified status: ${userRecord.emailVerified}`);
  } catch (error) {
    console.error(`❌ Error checking email status:`, error.message);
  }
  
  // Test A5: /api/auth/password/change (POST, Authenticated)
  const newPassword = 'NewTest123456';
  await testEndpoint(
    'A5: /api/auth/password/change',
    'POST',
    `${BASE_URL}/api/auth/password/change`,
    {
      'Authorization': `Bearer ${testToken}`
    },
    {
      currentPassword: testPassword,
      newPassword: newPassword
    }
  );
  
  // Test A6: /api/auth/password/reset-request (POST, Public)
  await testEndpoint(
    'A6: /api/auth/password/reset-request',
    'POST',
    `${BASE_URL}/api/auth/password/reset-request`,
    {},
    {
      email: testEmail
    }
  );
  
  // Test A6 with invalid email
  await testEndpoint(
    'A6: /api/auth/password/reset-request (invalid email)',
    'POST',
    `${BASE_URL}/api/auth/password/reset-request`,
    {},
    {
      email: 'nonexistent@example.com'
    }
  );
  
  // Test error cases
  console.log('\n\n🔍 Testing Error Cases');
  console.log('='.repeat(60));
  
  // A3 without auth
  await testEndpoint(
    'A3: /api/auth/verify-email/send (no auth)',
    'POST',
    `${BASE_URL}/api/auth/verify-email/send`
  );
  
  // A5 with invalid password
  await testEndpoint(
    'A5: /api/auth/password/change (weak password)',
    'POST',
    `${BASE_URL}/api/auth/password/change`,
    {
      'Authorization': `Bearer ${testToken}`
    },
    {
      currentPassword: newPassword,
      newPassword: 'weak'
    }
  );
  
  // A6 with invalid email format
  await testEndpoint(
    'A6: /api/auth/password/reset-request (invalid format)',
    'POST',
    `${BASE_URL}/api/auth/password/reset-request`,
    {},
    {
      email: 'invalid-email'
    }
  );
  
  console.log('\n\n✅ All tests completed!');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

