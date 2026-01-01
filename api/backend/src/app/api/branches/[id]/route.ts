import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Branch, BranchWithManagers, UpdateBranchRequest, BranchUpdateData } from '@shared/types/branch';
import { validateBranchName, validateBranchEmail, validateBranchPhone } from '@/lib/utils/validation/branchValidation';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { getBranchDetails } from '@/lib/utils/branchQueries';

// Note: getBranchManagers, getBranchEventCount, getBranchEducationCount fonksiyonları
// artık getBranchDetails() utility fonksiyonu kullanılıyor (src/lib/utils/branchQueries.ts)

// GET - Tek şube detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const branchId = params.id;
      
      const branchDoc = await db.collection('branches').doc(branchId).get();
      
      if (!branchDoc.exists) {
      throw new AppNotFoundError('Şube');
      }
      
      const branchData = branchDoc.data();
      
      // Kullanıcının rolünü kontrol et
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      // User ve Branch Manager için sadece aktif şubeleri göster
      if (userData?.role === USER_ROLE.USER || userData?.role === USER_ROLE.BRANCH_MANAGER) {
        if (!branchData?.isActive) {
        throw new AppNotFoundError('Şube');
        }
      }
      
    // Branch manager sadece kendi şubesini görebilir
    if (userData?.role === USER_ROLE.BRANCH_MANAGER && userData.branchId !== branchId) {
      throw new AppAuthorizationError('Bu şubeye erişim yetkiniz yok');
    }
    
    // Tüm branch bilgilerini tek seferde getir (optimize edilmiş ✅)
    const { eventCount, educationCount, managers } = await getBranchDetails(branchDoc.id);
    
    const branch: Branch = {
      id: branchDoc.id,
      ...branchData,
      eventCount,
      educationCount,
    } as Branch;
    
    // Manager bilgilerini ekle
    let branchWithManagers: BranchWithManagers = branch;
    
    // Admin ve Branch Manager manager bilgilerini görebilir
    if (userData?.role === USER_ROLE.ADMIN || 
        (userData?.role === USER_ROLE.BRANCH_MANAGER && userData.branchId === branchId)) {
      branchWithManagers = { ...branch, managers };
    }
    // User manager bilgilerini göremez
      
      return successResponse(
        'Şube başarıyla getirildi',
        { branch: branchWithManagers }
      );
  });
  });

// PUT - Şube güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const branchId = params.id;
      
      // Admin kontrolü
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== USER_ROLE.ADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const branchDoc = await db.collection('branches').doc(branchId).get();
      
      if (!branchDoc.exists) {
      throw new AppNotFoundError('Şube');
      }
      
    const body = await parseJsonBody<UpdateBranchRequest>(req);
      const { name, desc, location, address, phone, email, workingHours, isActive } = body;
      
      // Validation
      if (name !== undefined) {
        const nameValidation = validateBranchName(name);
        if (!nameValidation.valid) {
        throw new AppValidationError(nameValidation.error || 'Geçersiz şube adı');
        }
      }
      
      if (email !== undefined) {
        const emailValidation = validateBranchEmail(email);
        if (!emailValidation.valid) {
        throw new AppValidationError(emailValidation.error || 'Geçersiz e-posta');
        }
      }
      
      if (phone !== undefined) {
        const phoneValidation = validateBranchPhone(phone);
        if (!phoneValidation.valid) {
        throw new AppValidationError(phoneValidation.error || 'Geçersiz telefon');
        }
      }
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Sadece gönderilen alanları güncelle
      if (name !== undefined) updateData.name = name.trim();
      if (desc !== undefined) updateData.desc = desc?.trim() || null;
      if (location !== undefined) updateData.location = location || null;
      if (address !== undefined) updateData.address = address?.trim() || null;
      // Telefon numarasını normalize et (boşlukları kaldır)
      if (phone !== undefined) updateData.phone = phone?.trim().replace(/\s/g, '') || null;
      if (email !== undefined) updateData.email = email?.trim() || null;
      if (workingHours !== undefined) updateData.workingHours = workingHours || null;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      await db.collection('branches').doc(branchId).update(updateData as any);
      
    // Güncellenmiş şubeyi getir
    const updatedBranchDoc = await db.collection('branches').doc(branchId).get();
    const updatedBranchData = updatedBranchDoc.data();
    
    // Tüm branch bilgilerini tek seferde getir (optimize edilmiş ✅)
    const { eventCount, educationCount, managers } = await getBranchDetails(branchId);
    
    const branch: Branch = {
      id: branchId,
      ...updatedBranchData,
      eventCount,
      educationCount,
    } as Branch;
    
    const branchWithManagers: BranchWithManagers = { ...branch, managers };
      
      return successResponse(
        'Şube başarıyla güncellendi',
        { branch: branchWithManagers },
        200,
        'BRANCH_UPDATE_SUCCESS'
      );
  });
  });

// DELETE - Şube sil (sadece admin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const branchId = params.id;
      
      // Admin kontrolü
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== USER_ROLE.ADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const branchDoc = await db.collection('branches').doc(branchId).get();
      
      if (!branchDoc.exists) {
      throw new AppNotFoundError('Şube');
      }
      
      // Şubeye bağlı kullanıcı var mı kontrol et
      const usersWithBranch = await db.collection('users')
        .where('branchId', '==', branchId)
        .limit(1)
        .get();
      
      if (!usersWithBranch.empty) {
      throw new AppValidationError('Bu şubeye bağlı kullanıcılar var. Önce kullanıcıları başka şubeye taşıyın veya silin.');
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
  });
  });

