import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Branch, BranchWithManagers, UpdateBranchRequest, BranchUpdateData } from '@shared/types/branch';
import { validateBranchName, validateBranchEmail, validateBranchPhone } from '@/lib/utils/validation/branchValidation';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';

// Helper: Branch'in manager'larını getir
async function getBranchManagers(branchId: string) {
  const managersSnapshot = await db.collection('users')
    .where('branchId', '==', branchId)
    .where('role', '==', USER_ROLE.BRANCH_MANAGER)
    .where('isActive', '==', true)
    .get();
  
  return managersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };
  });
}

// GET - Tek şube detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const branchId = params.id;
      
      const branchDoc = await db.collection('branches').doc(branchId).get();
      
      if (!branchDoc.exists) {
        return notFoundError('Şube');
      }
      
      const branchData = branchDoc.data();
      
      // Kullanıcının rolünü kontrol et
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      // User ve Branch Manager için sadece aktif şubeleri göster
      if (userData?.role === USER_ROLE.USER || userData?.role === USER_ROLE.BRANCH_MANAGER) {
        if (!branchData?.isActive) {
          return notFoundError('Şube');
        }
      }
      
      // Branch manager sadece kendi şubesini görebilir
      if (userData?.role === USER_ROLE.BRANCH_MANAGER && userData.branchId !== branchId) {
        return unauthorizedError('Bu şubeye erişim yetkiniz yok');
      }
      
      const branch: Branch = {
        id: branchDoc.id,
        ...branchData,
      } as Branch;
      
      // Manager bilgilerini ekle
      let branchWithManagers: BranchWithManagers = branch;
      
      // Admin ve Branch Manager manager bilgilerini görebilir
      if (userData?.role === USER_ROLE.ADMIN || 
          (userData?.role === USER_ROLE.BRANCH_MANAGER && userData.branchId === branchId)) {
        const managers = await getBranchManagers(branchDoc.id);
        branchWithManagers = { ...branch, managers };
      }
      // User manager bilgilerini göremez
      
      return successResponse(
        'Şube başarıyla getirildi',
        { branch: branchWithManagers }
      );
      
    } catch (error: unknown) {
      console.error('❌ Get branch error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Şube getirilirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// PUT - Şube güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const branchId = params.id;
      
      // Admin kontrolü
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const branchDoc = await db.collection('branches').doc(branchId).get();
      
      if (!branchDoc.exists) {
        return notFoundError('Şube');
      }
      
      const body: UpdateBranchRequest = await request.json();
      const { name, code, address, city, district, phone, email, isActive } = body;
      
      // Validation
      if (name !== undefined) {
        const nameValidation = validateBranchName(name);
        if (!nameValidation.valid) {
          return validationError(nameValidation.error || 'Geçersiz şube adı');
        }
      }
      
      if (email !== undefined) {
        const emailValidation = validateBranchEmail(email);
        if (!emailValidation.valid) {
          return validationError(emailValidation.error || 'Geçersiz e-posta');
        }
      }
      
      if (phone !== undefined) {
        const phoneValidation = validateBranchPhone(phone);
        if (!phoneValidation.valid) {
          return validationError(phoneValidation.error || 'Geçersiz telefon');
        }
      }
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Sadece gönderilen alanları güncelle
      if (name !== undefined) updateData.name = name.trim();
      if (code !== undefined) updateData.code = code?.trim() || null;
      if (address !== undefined) updateData.address = address?.trim() || null;
      if (city !== undefined) updateData.city = city?.trim() || null;
      if (district !== undefined) updateData.district = district?.trim() || null;
      if (phone !== undefined) updateData.phone = phone?.trim() || null;
      if (email !== undefined) updateData.email = email?.trim() || null;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      await db.collection('branches').doc(branchId).update(updateData as any);
      
      // Güncellenmiş şubeyi getir
      const updatedBranchDoc = await db.collection('branches').doc(branchId).get();
      const updatedBranchData = updatedBranchDoc.data();
      const branch: Branch = {
        id: branchId,
        ...updatedBranchData,
      } as Branch;
      
      // Manager bilgilerini ekle
      const managers = await getBranchManagers(branchId);
      const branchWithManagers: BranchWithManagers = { ...branch, managers };
      
      return successResponse(
        'Şube başarıyla güncellendi',
        { branch: branchWithManagers },
        200,
        'BRANCH_UPDATE_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Update branch error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Şube güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// DELETE - Şube sil (sadece admin, hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const branchId = params.id;
      
      // Admin kontrolü
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const branchDoc = await db.collection('branches').doc(branchId).get();
      
      if (!branchDoc.exists) {
        return notFoundError('Şube');
      }
      
      // Şubeye bağlı kullanıcı var mı kontrol et
      const usersWithBranch = await db.collection('users')
        .where('branchId', '==', branchId)
        .limit(1)
        .get();
      
      if (!usersWithBranch.empty) {
        return validationError('Bu şubeye bağlı kullanıcılar var. Önce kullanıcıları başka şubeye taşıyın veya silin.');
      }
      
      // Hard delete - belgeyi tamamen sil
      await db.collection('branches').doc(branchId).delete();
      
      console.log(`✅ Branch ${branchId} deleted`);
      
      return successResponse(
        'Şube başarıyla silindi',
        undefined,
        200,
        'BRANCH_DELETE_SUCCESS'
      );
      
    } catch (error: unknown) {
      console.error('❌ Delete branch error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Şube silinirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

