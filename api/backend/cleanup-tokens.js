const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function cleanup() {
  const tokens = await db.collection('fcmTokens').get();
  console.log('Toplam FCM token:', tokens.size);
  
  let cleaned = 0;
  for (const doc of tokens.docs) {
    const data = doc.data();
    const token = data.token || '';
    
    // Test token'ları veya ExponentPushToken formatındaki tokenları temizle
    const isTestToken = token.startsWith('test-fcm-token');
    const isExpoPushToken = token.startsWith('ExponentPushToken');
    
    if (isTestToken || isExpoPushToken) {
      console.log('Siliniyor:', token.substring(0, 40) + '...', '| userId:', data.userId);
      await doc.ref.delete();
      cleaned++;
    }
  }
  
  console.log('\nTemizlenen token:', cleaned);
  
  // Kalan tokenları göster
  const remaining = await db.collection('fcmTokens').get();
  console.log('Kalan token:', remaining.size);
  remaining.docs.forEach(doc => {
    const d = doc.data();
    console.log('  userId:', d.userId, '| active:', d.isActive, '| token:', (d.token || '').substring(0, 40) + '...');
  });
  
  process.exit(0);
}
cleanup().catch(e => { console.error(e); process.exit(1); });
