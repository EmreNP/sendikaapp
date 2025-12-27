const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function checkLogs() {
  const userId = 'BCSQpn0bIncAItrUgNBqPnnAQYw1';
  const logs = await db.collection('user_registration_logs')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .get();
  
  console.log(`\n📋 Logs for user ${userId}:`);
  console.log(`Total: ${logs.size}\n`);
  
  logs.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`${i + 1}. Action: ${data.action}`);
    console.log(`   Role: ${data.performedByRole}`);
    console.log(`   Status: ${data.previousStatus || 'N/A'} → ${data.newStatus || 'N/A'}`);
    console.log(`   Performed By: ${data.performedBy}`);
    console.log(`   Timestamp: ${data.timestamp?.toDate?.() || data.timestamp}`);
    console.log('');
  });
}

checkLogs().then(() => process.exit(0)).catch(console.error);
