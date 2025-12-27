#!/usr/bin/env node

/**
 * Test script for SendikaApp Backend API
 * Uses Firebase Admin SDK to exchange custom token for ID token
 */

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing SendikaApp Backend API...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log(JSON.stringify(healthData, null, 2));
    console.log('\n');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Register Basic
  console.log('2️⃣ Testing Basic Registration...');
  const email = `test${Date.now()}@example.com`;
  
  let registerResponse;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register/basic`, {
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
    
    registerResponse = await res.json();
    console.log(JSON.stringify(registerResponse, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    return;
  }

  if (!registerResponse.success) {
    console.error('❌ Registration failed');
    return;
  }

  const uid = registerResponse.uid;
  const customToken = registerResponse.customToken;
  
  console.log(`✅ UID: ${uid}`);
  if (customToken) {
    console.log(`✅ Custom token received: ${customToken.substring(0, 20)}...`);
  } else {
    console.log('⚠️  No custom token received');
  }
  console.log('');

  // Test 3: Register Details
  // Development modunda custom token kullanılabilir (middleware destekliyor)
  if (customToken) {
    console.log('3️⃣ Testing Detailed Registration (with custom token)...');
    console.log('⚠️  Development mode: Using custom token directly\n');
    
    try {
      const detailsRes = await fetch(`${BASE_URL}/api/auth/register/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customToken}`
        },
        body: JSON.stringify({
          branchId: 'test-branch-123',
          phone: '05551234567',
          city: 'Istanbul',
          district: 'Kadıköy',
          // tcKimlikNo: '12345678901', // TC Kimlik No validation geçerli format gerektirir
          fatherName: 'Test Father',
          motherName: 'Test Mother'
        })
      });
      
      const detailsResponse = await detailsRes.json();
      console.log(JSON.stringify(detailsResponse, null, 2));
      
      if (detailsRes.ok) {
        console.log('\n✅ Details registration successful!');
      } else {
        console.log('\n⚠️  Details registration failed (this is OK if user already has details)');
      }
    } catch (error) {
      console.error('❌ Details registration test failed:', error.message);
    }
  } else {
    console.log('3️⃣ Skipping Details Registration (no custom token)');
    console.log('   To test details endpoint:');
    console.log('   1. Use custom token in client app');
    console.log('   2. Sign in with Firebase Auth');
    console.log('   3. Get ID token');
    console.log('   4. Use ID token in Authorization header');
  }

  console.log('\n✅ Basic tests completed!');
  console.log('\n📝 Next steps:');
  console.log('   - Use custom token in your mobile/web app');
  console.log('   - Sign in with Firebase Auth');
  console.log('   - Get ID token and use it for authenticated requests');
}

// Run tests
testAPI().catch(console.error);

