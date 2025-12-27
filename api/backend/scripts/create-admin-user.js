#!/usr/bin/env node

/**
 * Admin veya Branch Manager kullanıcısı oluşturma scripti
 * 
 * Kullanım:
 *   node scripts/create-admin-user.js admin admin@example.com Admin123! "Admin" "User"
 *   node scripts/create-admin-user.js branch_manager manager@example.com Manager123! "Manager" "User" branch-123
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Service account key'i yükle
let serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json bulunamadı!');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Firebase Admin SDK'yı başlat
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createAdminUser(role, email, password, firstName, lastName, branchId = null) {
  try {
    console.log(`\n🔧 ${role} kullanıcısı oluşturuluyor...`);
    console.log(`   Email: ${email}`);
    console.log(`   İsim: ${firstName} ${lastName}`);
    
    // 1. Firebase Auth'da kullanıcı oluştur
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true, // Test için email doğrulandı olarak işaretle
    });

    console.log(`✅ Firebase Auth kullanıcısı oluşturuldu: ${userRecord.uid}`);

    // 2. Firestore'da user belgesi oluştur
    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      role: role,
      status: 'active',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Branch manager için branchId ekle
    if (role === 'branch_manager' && branchId) {
      userData.branchId = branchId;
    }

    await db.collection('users').doc(userRecord.uid).set(userData);

    console.log(`✅ Firestore user belgesi oluşturuldu`);
    console.log(`\n📋 Kullanıcı Bilgileri:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${password}`);
    console.log(`   Rol: ${role}`);
    if (branchId) {
      console.log(`   Şube ID: ${branchId}`);
    }
    console.log(`\n✅ Başarılı! Artık admin panel'e giriş yapabilirsiniz.\n`);

  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === 'auth/email-already-exists') {
      console.error('   Bu e-posta adresi zaten kullanılıyor!');
    }
    process.exit(1);
  }
}

// Komut satırı argümanlarını al
const args = process.argv.slice(2);

if (args.length < 5) {
  console.log(`
📖 Kullanım:
  
  Admin oluştur:
    node scripts/create-admin-user.js admin <email> <password> <firstName> <lastName>
  
  Branch Manager oluştur:
    node scripts/create-admin-user.js branch_manager <email> <password> <firstName> <lastName> <branchId>

Örnek:
  node scripts/create-admin-user.js admin admin@sendikaapp.com Admin123! "Admin" "User"
  node scripts/create-admin-user.js branch_manager manager@sendikaapp.com Manager123! "Manager" "User" branch-istanbul-1
`);
  process.exit(1);
}

const [role, email, password, firstName, lastName, branchId] = args;

if (role !== 'admin' && role !== 'branch_manager') {
  console.error('❌ Rol sadece "admin" veya "branch_manager" olabilir!');
  process.exit(1);
}

if (role === 'branch_manager' && !branchId) {
  console.error('❌ Branch Manager için branchId gerekli!');
  process.exit(1);
}

createAdminUser(role, email, password, firstName, lastName, branchId);

