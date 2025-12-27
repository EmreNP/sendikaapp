import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { UserRegistrationLog } from '@shared/types/user';

export async function createRegistrationLog(
  logData: Omit<UserRegistrationLog, 'id' | 'timestamp'>
): Promise<void> {
  try {
    console.log(`📝 Creating registration log - Action: ${logData.action}, User: ${logData.userId}, PerformedBy: ${logData.performedBy}, Role: ${logData.performedByRole}`);
    console.log(`📋 Log data details:`, {
      userId: logData.userId,
      action: logData.action,
      performedBy: logData.performedBy,
      performedByRole: logData.performedByRole,
      previousStatus: logData.previousStatus,
      newStatus: logData.newStatus,
      hasNote: !!logData.note,
      hasDocumentUrl: !!logData.documentUrl,
    });
    
    const log: Omit<UserRegistrationLog, 'id'> = {
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    console.log(`💾 Adding log to Firestore collection: user_registration_logs`);
    const docRef = await db.collection('user_registration_logs').add(log);
    console.log(`✅ Registration log created successfully - ID: ${docRef.id}, Action: ${logData.action} for user ${logData.userId}`);
    console.log(`✅ Log document path: user_registration_logs/${docRef.id}`);
  } catch (error) {
    console.error('❌ CRITICAL: Failed to create registration log:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error name:', error.name);
    }
    // Hata durumunda throw edelim ki üstteki kod hatayı yakalayabilsin
    throw error;
  }
}

// Kullanıcının tüm loglarını getir
export async function getUserRegistrationLogs(
  userId: string
): Promise<UserRegistrationLog[]> {
  try {
    console.log(`📡 Fetching logs for user: ${userId}`);
    
    // Önce timestamp ile sıralanmış sorguyu dene
    let snapshot;
    try {
      snapshot = await db
        .collection('user_registration_logs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      console.log(`✅ Logs fetched with timestamp orderBy`);
    } catch (orderByError: any) {
      // Eğer index yoksa veya timestamp null ise, sadece where ile çek ve client-side sırala
      console.warn(`⚠️ Could not orderBy timestamp, fetching without orderBy:`, orderByError.message);
      snapshot = await db
        .collection('user_registration_logs')
        .where('userId', '==', userId)
        .get();
    }
    
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    }) as UserRegistrationLog[];
    
    // Client-side sıralama (timestamp varsa)
    logs.sort((a, b) => {
      // Timestamp'leri karşılaştır
      const aTime = a.timestamp?.toMillis?.() || a.timestamp?.seconds || 0;
      const bTime = b.timestamp?.toMillis?.() || b.timestamp?.seconds || 0;
      return bTime - aTime; // Descending order
    });
    
    console.log(`✅ Found ${logs.length} logs for user ${userId}`);
    logs.forEach((log, index) => {
      const statusInfo = log.previousStatus && log.newStatus 
        ? `${log.previousStatus} → ${log.newStatus}`
        : log.newStatus || log.previousStatus || 'no status';
      console.log(`  Log ${index + 1}: ${log.action} - ${log.performedByRole} - ${statusInfo} - ID: ${log.id}`);
    });
    
    return logs;
  } catch (error) {
    console.error('❌ Failed to get registration logs:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    return [];
  }
}

