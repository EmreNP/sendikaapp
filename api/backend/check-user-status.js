const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function checkUser() {
  const userId = 'BCSQpn0bIncAItrUgNBqPnnAQYw1';
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log(`\n👤 User: ${userId}`);
    console.log(`Status: ${data.status}`);
    console.log(`Role: ${data.role}`);
    console.log(`Updated At: ${data.updatedAt?.toDate?.() || data.updatedAt}`);
  } else {
    console.log('User not found');
  }
}

checkUser().then(() => process.exit(0)).catch(console.error);
