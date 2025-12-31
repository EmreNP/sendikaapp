/**
 * Branch Query Utilities
 * Branch ile ilgili optimize edilmiş query helper'ları
 */

import { db } from '@/lib/firebase/admin';
import { USER_ROLE } from '@shared/constants/roles';

/**
 * Tek branch için tüm bilgileri toplu olarak getir
 * Promise.all ile paralel query'ler (N+1 değil ama optimize)
 */
export async function getBranchDetails(branchId: string): Promise<{
  eventCount: number;
  educationCount: number;
  managers: Array<{ uid: string; firstName: string; lastName: string; email: string }>;
}> {
  const [eventsSnapshot, educationsSnapshot, managersSnapshot] = await Promise.all([
    db.collection('events')
      .where('branchId', '==', branchId)
      .get()
      .catch(() => ({ size: 0, docs: [] })),
    
    db.collection('educations')
      .where('branchId', '==', branchId)
      .get()
      .catch(() => ({ size: 0, docs: [] })),
    
    db.collection('users')
      .where('branchId', '==', branchId)
      .where('role', '==', USER_ROLE.BRANCH_MANAGER)
      .where('isActive', '==', true)
      .get()
      .catch(() => ({ docs: [] })),
  ]);

  return {
    eventCount: eventsSnapshot.size,
    educationCount: educationsSnapshot.size,
    managers: managersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
    }),
  };
}

