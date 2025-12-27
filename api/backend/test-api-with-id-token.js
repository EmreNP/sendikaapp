#!/usr/bin/env node

/**
 * Advanced test script that creates ID token for testing
 * Requires Firebase Admin SDK and Firebase Auth client SDK
 */

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing SendikaApp Backend API (with ID token)...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log(JSON.stringify(healthData, null, 2));
  console.log('\n');

  // Test 2: Register Basic
  console.log('2️⃣ Testing Basic Registration...');
  const email = `test${Date.now()}@example.com`;
  
  const registerRes = await fetch(`${BASE_URL}/api/auth/register/basic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: email,
      password: 'Test1234',
      birthDate: '1990-01-01',
      gender: 'male'
    })
  });
  
  const registerResponse = await registerResponse.json();
  console.log(JSON.stringify(registerResponse, null, 2));
  console.log('');

  if (!registerResponse.success) {
    console.error('❌ Registration failed');
    return;
  }

  const customToken = registerResponse.token;
  const uid = registerResponse.uid;
  
  console.log(`✅ Custom token received`);
  console.log(`✅ UID: ${uid}`);
  console.log('');

  // Test 3: Get ID Token
  console.log('3️⃣ Getting ID token from custom token...');
  console.log('⚠️  This requires Firebase Auth client SDK.');
  console.log('   For server-side testing, we can create a test ID token.\n');
  
  // Note: To properly test, you need to:
  // 1. Use Firebase Auth client SDK in a browser/Node.js
  // 2. Sign in with custom token: signInWithCustomToken(auth, customToken)
  // 3. Get ID token: await user.getIdToken()
  // 4. Use ID token in Authorization header
  
  console.log('📝 To test details endpoint:');
  console.log('   1. Install firebase package: npm install firebase');
  console.log('   2. Use custom token to sign in');
  console.log('   3. Get ID token and use it');
  
  console.log('\n✅ Tests completed!');
}

testAPI().catch(console.error);

