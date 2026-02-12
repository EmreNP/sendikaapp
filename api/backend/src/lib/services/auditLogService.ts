import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * Audit Log Types
 * Tüm önemli işlemleri loglamak için kullanılır
 */
export type AuditAction =
  // Kullanıcı işlemleri
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_status_changed'
  | 'user_bulk_action'
  // Aktivite işlemleri
  | 'activity_created'
  | 'activity_updated'
  | 'activity_deleted'
  // Haber işlemleri
  | 'news_created'
  | 'news_updated'
  | 'news_deleted'
  // Duyuru işlemleri
  | 'announcement_created'
  | 'announcement_updated'
  | 'announcement_deleted'
  // Bildirim işlemleri
  | 'notification_sent'
  // Eğitim işlemleri
  | 'training_created'
  | 'training_updated'
  | 'training_deleted';

export type AuditCategory = 'user' | 'activity' | 'news' | 'announcement' | 'notification' | 'training';

export interface AuditLogEntry {
  action: AuditAction;
  category: AuditCategory;
  performedBy: string;       // UID of the user who performed the action
  performedByName?: string;  // Display name
  performedByRole?: string;  // Role of performer
  branchId?: string;         // Branch context
  targetId?: string;         // ID of affected resource
  targetName?: string;       // Name/label of affected resource
  details?: Record<string, any>; // Extra details (e.g., category breakdown)
  message: string;           // Human-readable log message (Turkish)
  timestamp?: any;           // Server timestamp
}

/**
 * Audit log kaydı oluştur
 * Fire-and-forget — hata durumunda işlemi bloklamaz
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.collection('audit_logs').add({
      ...entry,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Audit log hatası ana işlemi engellemez
    logger.error('Audit log yazılamadı:', err);
  }
}

/**
 * Batch audit log — birden fazla log kaydını aynı anda yaz
 */
export async function createAuditLogBatch(entries: AuditLogEntry[]): Promise<void> {
  try {
    const batch = db.batch();
    for (const entry of entries) {
      const ref = db.collection('audit_logs').doc();
      batch.set(ref, {
        ...entry,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    logger.error('Batch audit log yazılamadı:', err);
  }
}
