/**
 * Batch Query Utilities
 * N+1 query sorunlarını çözmek için batch query helper'ları
 */

import { db } from '@/lib/firebase/admin';

/**
 * Firestore 'in' operatörü için chunk helper
 * Firestore max 10 item destekler
 */
export function chunkArray<T>(array: T[], chunkSize: number = 10): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Birden fazla lesson için tüm content'leri batch olarak getir
 * Returns: Lesson ID'ye göre gruplanmış content'ler
 */
export async function getLessonsContentsBatch(
  lessonIds: string[]
): Promise<{
  videos: Map<string, any[]>;
  documents: Map<string, any[]>;
  tests: Map<string, any[]>;
}> {
  if (lessonIds.length === 0) {
    return {
      videos: new Map(),
      documents: new Map(),
      tests: new Map(),
    };
  }

  const videos = new Map<string, any[]>();
  const documents = new Map<string, any[]>();
  const tests = new Map<string, any[]>();

  // Her lesson için boş array başlat
  lessonIds.forEach(id => {
    videos.set(id, []);
    documents.set(id, []);
    tests.set(id, []);
  });

  const chunks = chunkArray(lessonIds, 10);

  // Tüm query'leri paralel çalıştır
  const allQueries = chunks.flatMap(chunk => [
    // Video contents
    db.collection('video_contents')
      .where('lessonId', 'in', chunk)
      .get()
      .then(snapshot => {
        snapshot.docs.forEach(doc => {
          const lessonId = doc.data().lessonId;
          const existing = videos.get(lessonId) || [];
          existing.push({ id: doc.id, ...doc.data() });
          videos.set(lessonId, existing);
        });
      })
      .catch(error => {
        console.warn('Error fetching video contents batch:', error);
      }),

    // Document contents
    db.collection('document_contents')
      .where('lessonId', 'in', chunk)
      .get()
      .then(snapshot => {
        snapshot.docs.forEach(doc => {
          const lessonId = doc.data().lessonId;
          const existing = documents.get(lessonId) || [];
          existing.push({ id: doc.id, ...doc.data() });
          documents.set(lessonId, existing);
        });
      })
      .catch(error => {
        console.warn('Error fetching document contents batch:', error);
      }),

    // Test contents
    db.collection('test_contents')
      .where('lessonId', 'in', chunk)
      .get()
      .then(snapshot => {
        snapshot.docs.forEach(doc => {
          const lessonId = doc.data().lessonId;
          const existing = tests.get(lessonId) || [];
          existing.push({ id: doc.id, ...doc.data() });
          tests.set(lessonId, existing);
        });
      })
      .catch(error => {
        console.warn('Error fetching test contents batch:', error);
      }),
  ]);

  await Promise.all(allQueries);

  return { videos, documents, tests };
}

/**
 * Birden fazla lesson için tüm content'leri batch olarak sil
 * N+1 query problemini çözer
 */
export async function deleteLessonsContentsBatch(lessonIds: string[]): Promise<void> {
  if (lessonIds.length === 0) return;

  const chunks = chunkArray(lessonIds, 10);
  const deletePromises: Promise<any>[] = [];

  // Tüm content'leri batch olarak getir ve sil
  for (const chunk of chunks) {
    try {
      // Video contents - Batch query
      const videoSnapshot = await db.collection('video_contents')
        .where('lessonId', 'in', chunk)
        .get();
      videoSnapshot.docs.forEach(doc => {
        deletePromises.push(doc.ref.delete());
      });

      // Document contents - Batch query
      const documentSnapshot = await db.collection('document_contents')
        .where('lessonId', 'in', chunk)
        .get();
      documentSnapshot.docs.forEach(doc => {
        deletePromises.push(doc.ref.delete());
      });

      // Test contents - Batch query
      const testSnapshot = await db.collection('test_contents')
        .where('lessonId', 'in', chunk)
        .get();
      testSnapshot.docs.forEach(doc => {
        deletePromises.push(doc.ref.delete());
      });
    } catch (error) {
      console.warn('Error in batch delete for chunk:', error);
      // Devam et, diğer chunk'ları işle
    }
  }

  // Tüm delete işlemlerini paralel çalıştır
  await Promise.all(deletePromises);
}

