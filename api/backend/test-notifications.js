const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function test() {
  const allUsers = await db.collection('users').get();
  console.log('=== TOPLAM KULLANICI:', allUsers.size, '===');
  
  let activeCount = 0, inactiveCount = 0, noIsActive = 0;
  const branchCounts = {};
  
  allUsers.docs.forEach(doc => {
    const d = doc.data();
    if (d.isActive === true) activeCount++;
    else if (d.isActive === false) inactiveCount++;
    else noIsActive++;
    const br = d.branchId || 'NO-BRANCH';
    branchCounts[br] = (branchCounts[br] || 0) + 1;
  });
  
  console.log('isActive=true:', activeCount, '| isActive=false:', inactiveCount, '| isActive yok:', noIsActive);
  console.log('Sube dagilimi:', JSON.stringify(branchCounts, null, 2));
  
  // FCM tokens
  const tokens = await db.collection('fcmTokens').get();
  console.log('\n--- FCM TOKENS ---');
  console.log('Toplam:', tokens.size);
  let at = 0, it = 0;
  tokens.docs.forEach(doc => { if (doc.data().isActive) at++; else it++; });
  console.log('Aktif:', at, '| Pasif:', it);
  
  tokens.docs.forEach(doc => {
    const d = doc.data();
    console.log('  userId:', d.userId, '| active:', d.isActive, '| token:', (d.token || '').substring(0, 25) + '...');
  });
  
  // Branch managers
  const bms = await db.collection('users').where('role', '==', 'branch_manager').get();
  console.log('\n--- BRANCH MANAGERS ---');
  for (const bm of bms.docs) {
    const d = bm.data();
    console.log('BM:', d.firstName, d.lastName, '| branchId:', d.branchId);
    if (d.branchId) {
      const bu = await db.collection('users')
        .where('branchId', '==', d.branchId)
        .where('isActive', '==', true)
        .get();
      console.log('  Sube aktif kullanici:', bu.size);
      const ids = bu.docs.map(x => x.id);
      if (ids.length > 0) {
        const ts = await db.collection('fcmTokens')
          .where('userId', 'in', ids.slice(0, 10))
          .where('isActive', '==', true)
          .get();
        console.log('  Bu kullanicilarin aktif tokenlari:', ts.size);
      }
    }
  }
  
  // Notification history
  const history = await db.collection('notificationHistory').orderBy('createdAt', 'desc').limit(5).get();
  console.log('\n--- SON 5 BILDIRIM GECMISI ---');
  history.docs.forEach(doc => {
    const d = doc.data();
    console.log('  Title:', d.title, '| audience:', d.targetAudience, '| branchId:', d.branchId, '| sent:', d.sentCount, '| failed:', d.failedCount);
  });
  
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
