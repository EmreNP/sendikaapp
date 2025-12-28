#!/usr/bin/env node

/**
 * Admin kullanıcı için ID token al
 * Firebase Client SDK kullanarak gerçek ID token oluşturur
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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

// Firebase Client SDK
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');

// Firebase config
// Environment variable'lardan, .env dosyasından veya serviceAccount'tan al
const projectId = serviceAccount.project_id || 'sendikaapp';

// .env dosyasını oku (varsa)
let envApiKey, envAuthDomain;
try {
  const envPath = path.resolve(__dirname, '../admin-panel/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      if (line.startsWith('VITE_FIREBASE_API_KEY=')) {
        envApiKey = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
      }
      if (line.startsWith('VITE_FIREBASE_AUTH_DOMAIN=')) {
        envAuthDomain = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
} catch (error) {
  // .env dosyası yoksa devam et
}

// Mobile config'den fallback değerler (hardcoded - sadece development için)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || envApiKey || 'AIzaSyAdapALu0uxSKdL9_Ew99x08Y8SL-wavGY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || envAuthDomain || `${projectId}.firebaseapp.com`,
  projectId: projectId,
};

async function getAdminIdToken(email, password) {
  try {
    console.log(`🔍 Kullanıcı kontrol ediliyor: ${email}\n`);
    
    // Kullanıcıyı bul
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Kullanıcı bulundu: ${userRecord.uid}`);
    
    // Kullanıcının admin olduğunu kontrol et
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      console.error('❌ Kullanıcı Firestore\'da bulunamadı!');
      return null;
    }
    
    const userData = userDoc.data();
    console.log(`   Rol: ${userData.role || 'not set'}`);
    
    // Admin değilse admin yap
    if (userData.role !== 'admin') {
      console.log(`\n⚠️  Kullanıcı admin değil, admin yapılıyor...`);
      await db.collection('users').doc(userRecord.uid).update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Kullanıcı admin yapıldı!`);
    }
    
    // Önce custom token oluştur
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log(`\n✅ Custom token oluşturuldu`);
    
    // API key varsa Firebase Client SDK ile direkt ID token al
    if (firebaseConfig.apiKey) {
      try {
        console.log(`\n🔐 Custom token ID token'a çevriliyor...`);
        
        // Firebase app'i başlat
        const app = initializeApp(firebaseConfig);
        const authClient = getAuth(app);
        
        // Custom token ile giriş yap
        const userCredential = await signInWithCustomToken(authClient, customToken);
        const idToken = await userCredential.user.getIdToken();
        
        console.log(`✅ ID token alındı!`);
        console.log(`   UID: ${userCredential.user.uid}`);
        console.log(`   Email: ${userCredential.user.email || email}`);
        console.log(`\n📋 ID Token:`);
        console.log(`   ${idToken}`);
        console.log(`\n💡 Bu token'ı kullanarak API test edebilirsiniz:`);
        console.log(`   curl -H "Authorization: Bearer ${idToken}" http://localhost:3001/api/news`);
        console.log(`\n🧪 Test scripti ile:`);
        console.log(`   node test-news-api.js ${email} ${idToken}`);
        
        return idToken;
      } catch (error) {
        console.error(`\n⚠️  Custom token ID token'a çevrilemedi: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`\n💡 Custom token ile devam ediliyor...`);
      }
    } else {
      console.log(`\n⚠️  FIREBASE_API_KEY bulunamadı`);
      console.log(`   Custom token oluşturuldu, ID token'a çevirmek için API key gerekli`);
    }
    
    // Fallback: Custom token döndür
    console.log(`\n📋 Custom Token:`);
    console.log(`   ${customToken}`);
    console.log(`\n💡 Custom token'ı ID token'a çevirmek için:`);
    console.log(`   1. Admin panel'den giriş yapın (http://localhost:5173)`);
    console.log(`   2. Browser console'da: localStorage.getItem('token') veya`);
    console.log(`   3. Firebase API key ile:`);
    console.log(`      FIREBASE_API_KEY=your-api-key node get-admin-token.js ${email} ${password}`);
    
    return customToken;
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Kullanıcı bulunamadı: ${email}`);
    } else if (error.code === 'auth/wrong-password') {
      console.error(`❌ Yanlış şifre!`);
    } else if (error.code === 'auth/invalid-email') {
      console.error(`❌ Geçersiz email!`);
    } else {
      console.error('❌ Hata:', error.message);
      console.error('   Code:', error.code);
    }
    return null;
  }
}

// Ana fonksiyon
async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || 'emreozdemir394@gmail.com';
  const password = args[1] || 'deneme123';
  
  console.log('📋 Admin ID Token Alma Scripti\n');
  console.log('='.repeat(60));
  
  const idToken = await getAdminIdToken(email, password);
  
  if (idToken) {
    console.log('\n✅ Başarılı! Token yukarıda gösterildi.');
    console.log('\n🧪 Test için:');
    console.log(`   node test-news-api.js ${email} ${idToken}`);
  } else {
    console.log('\n❌ Token alınamadı!');
    process.exit(1);
  }
}

main().catch(console.error);

