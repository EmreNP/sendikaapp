import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

import { logger } from '../../lib/utils/logger';
/**
 * Training için mevcut en yüksek order'ı bulur ve yeni order döndürür
 */
export async function getNextTrainingOrder(): Promise<number> {
  try {
    const snapshot = await db.collection('trainings')
      .orderBy('order', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return 1;
    }
    
    const maxOrder = snapshot.docs[0].data().order || 0;
    return maxOrder + 1;
  } catch (error) {
    logger.error('Error getting next training order:', error);
    return 1;
  }
}

/**
 * Belirli bir training içindeki en yüksek lesson order'ını bulur ve yeni order döndürür
 */
export async function getNextLessonOrder(trainingId: string): Promise<number> {
  try {
    const snapshot = await db.collection('lessons')
      .where('trainingId', '==', trainingId)
      .orderBy('order', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return 1;
    }
    
    const maxOrder = snapshot.docs[0].data().order || 0;
    return maxOrder + 1;
  } catch (error) {
    logger.error('Error getting next lesson order:', error);
    return 1;
  }
}

/**
 * Belirli bir lesson içindeki en yüksek content order'ını bulur ve yeni order döndürür
 */
export async function getNextContentOrder(lessonId: string, contentType: 'video' | 'document' | 'test'): Promise<number> {
  try {
    let collectionName: string;
    switch (contentType) {
      case 'video':
        collectionName = 'video_contents';
        break;
      case 'document':
        collectionName = 'document_contents';
        break;
      case 'test':
        collectionName = 'test_contents';
        break;
      default:
        return 1;
    }
    
    const snapshot = await db.collection(collectionName)
      .where('lessonId', '==', lessonId)
      .orderBy('order', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return 1;
    }
    
    const maxOrder = snapshot.docs[0].data().order || 0;
    return maxOrder + 1;
  } catch (error) {
    logger.error('Error getting next content order:', error);
    return 1;
  }
}

/**
 * FAQ için mevcut en yüksek order'ı bulur ve yeni order döndürür
 */
export async function getNextFAQOrder(): Promise<number> {
  try {
    const snapshot = await db.collection('faqs')
      .orderBy('order', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return 1;
    }
    
    const maxOrder = snapshot.docs[0].data().order || 0;
    return maxOrder + 1;
  } catch (error) {
    logger.error('Error getting next FAQ order:', error);
    return 1;
  }
}

/**
 * Order değiştirildiğinde, belirtilen order ve sonrasındaki tüm order'ları bir sıra yukarı kaydırır
 * @param collectionName - Firestore collection adı
 * @param filterField - Filtreleme için kullanılacak field (örn: 'trainingId', 'lessonId')
 * @param filterValue - Filtreleme değeri
 * @param newOrder - Yeni order değeri
 * @param excludeId - Güncellenmeyecek document ID (mevcut item)
 */
export async function shiftOrdersUp(
  collectionName: string,
  filterField: string,
  filterValue: string,
  newOrder: number,
  excludeId?: string
): Promise<void> {
  try {
    // Belirtilen order ve sonrasındaki tüm item'ları bul
    let query = db.collection(collectionName)
      .where(filterField, '==', filterValue)
      .where('order', '>=', newOrder) as admin.firestore.Query;
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return;
    }
    
    // Batch write için güncellemeleri hazırla
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.docs.forEach((doc) => {
      // Mevcut item'ı atla
      if (excludeId && doc.id === excludeId) {
        return;
      }
      
      const currentOrder = doc.data().order || 0;
      batch.update(doc.ref, {
        order: currentOrder + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updateCount++;
    });
    
    // Firestore batch limit: 500
    if (updateCount > 0 && updateCount <= 500) {
      await batch.commit();
      logger.log(`✅ Shifted ${updateCount} orders up in ${collectionName}`);
    } else if (updateCount > 500) {
      // Eğer 500'den fazla güncelleme varsa, chunk'lar halinde yap
      const chunks: admin.firestore.DocumentSnapshot[][] = [];
      for (let i = 0; i < snapshot.docs.length; i += 500) {
        chunks.push(snapshot.docs.slice(i, i + 500));
      }
      
      for (const chunk of chunks) {
        const chunkBatch = db.batch();
        chunk.forEach((doc) => {
          if (excludeId && doc.id === excludeId) {
            return;
          }
          const currentOrder = doc.data()?.order || 0;
          chunkBatch.update(doc.ref, {
            order: currentOrder + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await chunkBatch.commit();
      }
      logger.log(`✅ Shifted ${updateCount} orders up in ${collectionName} (chunked)`);
    }
  } catch (error) {
    logger.error(`Error shifting orders up in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Order değiştirildiğinde, belirtilen order ve sonrasındaki tüm order'ları bir sıra aşağı kaydırır
 * (Silme işlemleri için)
 */
export async function shiftOrdersDown(
  collectionName: string,
  filterField: string,
  filterValue: string,
  deletedOrder: number
): Promise<void> {
  try {
    // Silinen order'dan sonraki tüm item'ları bul
    const snapshot = await db.collection(collectionName)
      .where(filterField, '==', filterValue)
      .where('order', '>', deletedOrder)
      .get();
    
    if (snapshot.empty) {
      return;
    }
    
    // Batch write için güncellemeleri hazırla
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.docs.forEach((doc) => {
      const currentOrder = doc.data().order || 0;
      batch.update(doc.ref, {
        order: currentOrder - 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updateCount++;
    });
    
    if (updateCount > 0 && updateCount <= 500) {
      await batch.commit();
      logger.log(`✅ Shifted ${updateCount} orders down in ${collectionName}`);
    } else if (updateCount > 500) {
      // Chunk'lar halinde yap
      const chunks: admin.firestore.DocumentSnapshot[][] = [];
      for (let i = 0; i < snapshot.docs.length; i += 500) {
        chunks.push(snapshot.docs.slice(i, i + 500));
      }
      
      for (const chunk of chunks) {
        const chunkBatch = db.batch();
        chunk.forEach((doc) => {
          const currentOrder = doc.data()?.order || 0;
          chunkBatch.update(doc.ref, {
            order: currentOrder - 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await chunkBatch.commit();
      }
      logger.log(`✅ Shifted ${updateCount} orders down in ${collectionName} (chunked)`);
    }
  } catch (error) {
    logger.error(`Error shifting orders down in ${collectionName}:`, error);
    throw error;
  }
}

