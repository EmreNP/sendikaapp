// Test script to check activities in Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkActivities() {
  try {
    console.log('\n🔍 Checking activities in Firestore...\n');
    
    const activitiesSnapshot = await db.collection('activities').get();
    console.log(`📊 Total activities in database: ${activitiesSnapshot.size}\n`);
    
    if (activitiesSnapshot.size > 0) {
      console.log('📝 Activity details:\n');
      
      activitiesSnapshot.forEach((doc) => {
        const activity = doc.data();
        const createdAt = activity.createdAt?.toDate?.() || activity.createdAt;
        const activityDate = activity.activityDate?.toDate?.() || activity.activityDate;
        
        console.log(`  • ${activity.name}`);
        console.log(`    ID: ${doc.id}`);
        console.log(`    Created: ${createdAt || 'N/A'}`);
        console.log(`    Activity Date: ${activityDate || 'N/A'}`);
        console.log(`    Branch: ${activity.branchId || 'N/A'}`);
        console.log(`    Published: ${activity.isPublished || false}`);
        console.log('');
      });
      
      // Check date range
      console.log('\n📅 Date Range Analysis:');
      console.log(`  Current time: ${new Date().toISOString()}`);
      
      const defaultStart = new Date();
      defaultStart.setMonth(defaultStart.getMonth() - 1);
      console.log(`  Default start date (1 month ago): ${defaultStart.toISOString()}`);
      console.log(`  Default end date (now): ${new Date().toISOString()}`);
      
      console.log('\n  Activities within default range:');
      let inRangeCount = 0;
      activitiesSnapshot.forEach((doc) => {
        const activity = doc.data();
        const createdAt = activity.createdAt?.toDate?.() || new Date(activity.createdAt);
        
        if (createdAt >= defaultStart && createdAt <= new Date()) {
          inRangeCount++;
          console.log(`    ✅ ${activity.name} - ${createdAt.toISOString()}`);
        } else {
          console.log(`    ❌ ${activity.name} - ${createdAt.toISOString()} (OUTSIDE RANGE)`);
        }
      });
      
      console.log(`\n  📊 Activities in default range: ${inRangeCount}/${activitiesSnapshot.size}`);
    } else {
      console.log('⚠️  No activities found in the database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkActivities();
