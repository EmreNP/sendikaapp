import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError, AppValidationError } from '@/lib/utils/errors/AppError';
import { parseJsonBody } from '@/lib/utils/request';
import { USER_ROLE } from '@shared/constants/roles';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const SETTINGS_DOC = db.collection('settings').doc('baskanSignature');

// GET /api/settings/signature
// Herkes (tüm roller) okuyabilir; imza form önizlemesinde herkese gösterilir.
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async () => {
    const snap = await SETTINGS_DOC.get();
    if (!snap.exists) {
      return successResponse('İmza bulunamadı', { dataUrl: null });
    }
    const data = snap.data();
    return successResponse('İmza getirildi', { dataUrl: data?.dataUrl ?? null });
  });
});

// PUT /api/settings/signature
// Sadece superadmin güncelleyebilir.
export const PUT = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Başkan imzasını yalnızca süper admin güncelleyebilir');
    }

    const body = await parseJsonBody<{ dataUrl: string | null }>(request);

    // null veya boş string → imzayı sil
    if (!body.dataUrl) {
      await SETTINGS_DOC.set({ dataUrl: null, updatedAt: new Date().toISOString(), updatedBy: user.uid });
      return successResponse('İmza silindi', { dataUrl: null });
    }

    // Sadece data URL kabul et
    if (!body.dataUrl.startsWith('data:image/')) {
      throw new AppValidationError('Geçersiz imza formatı. data:image/* bekleniyor.');
    }

    // ~1.5MB base64 limitini aşmaması için boyut kontrolü (Firestore döküman limiti ~1MB)
    const byteEstimate = Math.ceil((body.dataUrl.length * 3) / 4);
    if (byteEstimate > 600 * 1024) {
      throw new AppValidationError('İmza dosyası çok büyük (maksimum ~600KB). Daha küçük bir resim kullanın.');
    }

    await SETTINGS_DOC.set({
      dataUrl: body.dataUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });

    return successResponse('Başkan imzası güncellendi', { dataUrl: body.dataUrl });
  });
});
