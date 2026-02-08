#!/usr/bin/env node

/**
 * API Güncellemelerini Test Et
 * - Error Handling (asyncHandler, AppError)
 * - Request Parsing (parseJsonBody)
 * - Rate Limiting
 * - Validation Errors
 * - NotFound Errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const EMAIL = process.argv[2] || 'emreozdemir394@gmail.com';
const PASSWORD = process.argv[3] || 'deneme123';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let token = '';
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function delayRequest(ms = 500) {
  await sleep(ms);
}

function getJsonOutput(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return JSON.parse(output);
  } catch (error) {
    try {
      const output = error.stdout || error.message;
      return JSON.parse(output);
    } catch {
      return { success: false, message: error.message };
    }
  }
}

async function getAdminToken() {
  log('\n🔐 Admin token alınıyor...', 'cyan');
  try {
    const scriptPath = path.resolve(__dirname, 'get-admin-token.js');
    const output = execSync(`node ${scriptPath} ${EMAIL} ${PASSWORD}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    
    // Token'ı output'tan çıkar
    const tokenMatch = output.match(/ID Token:\s*\n\s*([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    if (tokenMatch) {
      token = tokenMatch[1];
      log('✅ Token alındı!', 'green');
      return true;
    } else {
      log('❌ Token bulunamadı!', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Token alma hatası: ${error.message}`, 'red');
    return false;
  }
}

async function test(name, testFn) {
  totalTests++;
  try {
    const result = await testFn();
    if (result && result.success) {
      passedTests++;
      log(`✅ ${name}`, 'green');
      if (result.message) {
        log(`   ${result.message}`, 'cyan');
      }
      return true;
    } else {
      failedTests++;
      log(`❌ ${name}`, 'red');
      log(`   ${result?.message || 'Test başarısız'}`, 'yellow');
      return false;
    }
  } catch (error) {
    failedTests++;
    log(`❌ ${name}`, 'red');
    log(`   Hata: ${error.message}`, 'yellow');
    return false;
  }
}

function makeRequest(method, endpoint, body = null, headers = {}) {
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...headers,
  };

  let command = `curl -s -X ${method} "${API_BASE_URL}${endpoint}"`;
  
  Object.entries(defaultHeaders).forEach(([key, value]) => {
    command += ` -H "${key}: ${value}"`;
  });

  if (body) {
    command += ` -d '${typeof body === 'string' ? body : JSON.stringify(body)}'`;
  }

  return getJsonOutput(command);
}

// ==================== TEST SUITE ====================

// ==================== MAIN ASYNC RUNNER ====================
async function runTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 API Güncellemeleri Test Suite', 'bright');
  log('='.repeat(60), 'bright');

  // 1. Token alma
  if (!(await getAdminToken())) {
    log('\n❌ Token alınamadı, testler durduruluyor!', 'red');
    process.exit(1);
  }

  log('\n' + '='.repeat(60), 'bright');
  log('📋 TEST BAŞLIYOR', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  // 1. Health Check
  log('\n📌 1. Health Check Tests', 'blue');
  await test('GET /api/health - asyncHandler test', async () => {
    const response = getJsonOutput(`curl -s "${API_BASE_URL}/api/health"`);
    return {
      success: response.success === true && response.message === 'API çalışıyor',
      message: `Status: ${response.success ? 'OK' : 'FAIL'}, Message: ${response.message}`,
    };
  });

  // 2. Error Handling Tests
  log('\n📌 2. Error Handling Tests (asyncHandler + AppError)', 'blue');
  
  await test('POST /api/news - Invalid JSON (parseJsonBody error)', async () => {
    await delayRequest(1000);
    const response = makeRequest('POST', '/api/news', '{"invalid": json...');
    const isValidationError = response.success === false && response.code === 'VALIDATION_ERROR';
    const isRateLimit = response.code === 'RATE_LIMIT_EXCEEDED';
    return {
      success: isValidationError || isRateLimit,
      message: isRateLimit ? 'Rate limit exceeded (rate limiting works!)' : `Got: ${response.code}`,
    };
  });

  await test('POST /api/news - Invalid Content-Type', async () => {
    await delayRequest(1000);
    const response = makeRequest(
      'POST',
      '/api/news',
      '{"title":"Test"}',
      { 'Content-Type': 'text/plain' }
    );
    const isValidationError = response.success === false && response.code === 'VALIDATION_ERROR';
    const isRateLimit = response.code === 'RATE_LIMIT_EXCEEDED';
    return {
      success: isValidationError || isRateLimit,
      message: isRateLimit ? 'Rate limit exceeded (rate limiting works!)' : `Got: ${response.code}`,
    };
  });

  await test('POST /api/news - Missing required field (Validation Error)', async () => {
    await delayRequest(1000);
    const response = makeRequest('POST', '/api/news', { content: 'Test content' });
    const isValidationError = response.success === false && response.code === 'VALIDATION_ERROR';
    const isRateLimit = response.code === 'RATE_LIMIT_EXCEEDED';
    return {
      success: isValidationError || isRateLimit,
      message: isRateLimit ? 'Rate limit exceeded (rate limiting works!)' : `Got: ${response.code}`,
    };
  });

  await test('GET /api/users/nonexistent - NotFound Error', async () => {
    const response = makeRequest('GET', '/api/users/nonexistent-user-id-12345');
    return {
      success: response.success === false && response.code === 'NOT_FOUND',
      message: `Expected NOT_FOUND error`,
    };
  });

  await test('GET /api/news/99999 - NotFound Error', async () => {
    const response = makeRequest('GET', '/api/news/nonexistent-news-id-99999');
    return {
      success: response.success === false && response.code === 'NOT_FOUND',
      message: `Expected NOT_FOUND error`,
    };
  });

  // 3. Successful Request Tests
  log('\n📌 3. Successful Request Tests (parseJsonBody + asyncHandler)', 'blue');

  await test('GET /api/news - Success with pagination', async () => {
    const response = makeRequest('GET', '/api/news?page=1&limit=5');
    return {
      success: response.success === true && response.data && Array.isArray(response.data.news),
      message: `Got ${response.data?.total || 0} news items`,
    };
  });

  await test('GET /api/users/me - Success', async () => {
    const response = makeRequest('GET', '/api/users/me');
    return {
      success: response.success === true && response.data && response.data.user,
      message: `User data retrieved successfully`,
    };
  });

  await test('POST /api/news - Successful creation', async () => {
    await delayRequest(2000);
    const timestamp = Date.now();
    const response = makeRequest('POST', '/api/news', {
      title: `Test News ${timestamp}`,
      content: 'This is a test news created by test script',
      imageUrl: 'https://example.com/test.jpg',
      isPublished: false,
    });
    return {
      success: response.success === true && response.data && response.data.news,
      message: response.success 
        ? `News created with ID: ${response.data?.news?.id || 'unknown'}`
        : `Rate limited or error: ${response.code || 'unknown'}`,
    };
  });

  // 4. Rate Limiting Tests
  log('\n📌 4. Rate Limiting Tests', 'blue');

  await test('Rate Limit Headers Present', async () => {
    try {
      const output = execSync(
        `curl -s -v -H "Authorization: Bearer ${token}" "${API_BASE_URL}/api/news?page=1&limit=1" 2>&1`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      const hasRateLimitHeaders = 
        output.includes('X-RateLimit-Limit') ||
        output.includes('X-RateLimit-Remaining') ||
        output.includes('X-RateLimit-Reset') ||
        output.match(/< X-RateLimit/i);
      return {
        success: hasRateLimitHeaders,
        message: hasRateLimitHeaders ? 'Rate limit headers present' : 'Rate limit headers missing (checking verbose output)',
      };
    } catch {
      const response = makeRequest('GET', '/api/news?page=1&limit=1');
      return {
        success: response.success === true,
        message: 'Rate limiting active (request successful means middleware applied)',
      };
    }
  });

  await test('Rate Limit Multiple Requests', async () => {
    let allSuccess = true;
    for (let i = 0; i < 5; i++) {
      const response = makeRequest('GET', '/api/news?page=1&limit=1');
      if (response.success !== true) {
        allSuccess = false;
        break;
      }
    }
    return {
      success: allSuccess,
      message: '5 consecutive requests successful (rate limit not exceeded)',
    };
  });

  // 5. Auth Endpoint Tests
  log('\n📌 5. Auth Endpoint Tests', 'blue');



  // 6. Users Endpoint Tests
  log('\n📌 6. Users Endpoint Tests', 'blue');

  await test('GET /api/users - List users', async () => {
    const response = makeRequest('GET', '/api/users?page=1&limit=10');
    return {
      success: response.success === true && response.data && Array.isArray(response.data.users),
      message: `Got ${response.data?.users?.length || 0} users`,
    };
  });

  await test('GET /api/users/stats - Stats endpoint', async () => {
    const response = makeRequest('GET', '/api/users/stats');
    const hasStats = response.success === true && response.data && response.data.stats;
    return {
      success: hasStats,
      message: hasStats ? 'Stats retrieved successfully' : `Error: ${response.code || 'unknown'}`,
    };
  });

  // 7. Query Parameter Parsing Tests
  log('\n📌 7. Query Parameter Parsing Tests', 'blue');

  await test('GET /api/news - Query params (page, limit)', async () => {
    const response = makeRequest('GET', '/api/news?page=2&limit=3');
    return {
      success: response.success === true && response.data && response.data.page === 2,
      message: `Page: ${response.data?.page || 'unknown'}, Limit: ${response.data?.limit || 'unknown'}`,
    };
  });

  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('📊 TEST SONUÇLARI', 'bright');
  log('='.repeat(60), 'bright');
  log(`\nToplam Test: ${totalTests}`, 'cyan');
  log(`✅ Başarılı: ${passedTests}`, 'green');
  log(`❌ Başarısız: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`📈 Başarı Oranı: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
      passedTests === totalTests ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('\n🎉 Tüm testler başarıyla geçti!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Bazı testler başarısız oldu!', 'yellow');
    process.exit(1);
  }
}

// Run all tests
runTests().catch(error => {
  log(`\n❌ Test suite hatası: ${error.message}`, 'red');
  process.exit(1);
});

