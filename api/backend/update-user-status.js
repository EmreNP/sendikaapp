#!/usr/bin/env node

/**
 * Kullanıcı durumunu güncelle
 * Kullanım: node update-user-status.js <email> <status>
 * Örnek: node update-user-status.js buyukfuat52@gmail.com active
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Argümanları al
const args = process.argv.slice(2);
const targetEmail = args[0] || 'buyukfuat52@gmail.com';
const newStatus = args[1] || 'active';

console.log('🔧 Kullanıcı Durumu Güncelleme Script');
console.log('====================================');
console.log(`📧 Email: ${targetEmail}`);
console.log(`📊 Yeni Status: ${newStatus}`);
console.log('');

// Service account key'i yükle
let serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
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

const auth = admin.auth();
const db = admin.firestore();

async function updateUserStatus() {
  try {
    // 1. Email ile kullanıcıyı bul
    console.log('🔍 Kullanıcı aranıyor...');
    const userRecord = await auth.getUserByEmail(targetEmail);
    const userId = userRecord.uid;
    
    console.log(`✅ Kullanıcı bulundu: ${userId}`);
    console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    console.log('');

    // 2. Firestore'da kullanıcı belgesini getir
    console.log('📄 Firestore verisi alınıyor...');
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error('❌ Firestore\'da kullanıcı belgesi bulunamadı!');
      process.exit(1);
    }
    
    const userData = userDoc.data();
    const currentStatus = userData.status;
    
    console.log(`   Mevcut Status: ${currentStatus}`);
    console.log(`   Rol: ${userData.role || 'N/A'}`);
    console.log(`   İsim: ${userData.firstName} ${userData.lastName}`);
    console.log('');

    // 3. Status'ü güncelle
    console.log('📝 Status güncelleniyor...');
    
    const updateData = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Eğer active yapıyorsak, activatedAt'i de ekle
    if (newStatus === 'active') {
      updateData.activatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await db.collection('users').doc(userId).update(updateData);
    
    console.log(`✅ Status başarıyla güncellendi: ${currentStatus} → ${newStatus}`);
    console.log('');

    // 4. Doğrulama
    console.log('🔄 Doğrulama yapılıyor...');
    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();
    
    console.log(`   Yeni Status: ${updatedData.status}`);
    console.log('');
    
    if (updatedData.status === newStatus) {
      console.log('✅✅✅ İşlem başarılı!');
      console.log('');
      console.log('📱 Kullanıcı artık eğitimlere erişebilir.');
      console.log('   Mobil uygulamada çıkış yapıp tekrar giriş yapması gerekebilir.');
    } else {
      console.log('⚠️ Status güncelleme tamamlandı ancak doğrulanamadı.');
    }

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Kullanıcı bulunamadı: ${targetEmail}`);
    } else {
      console.error('❌ Hata:', error.message);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

updateUserStatus();
