import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../firebase/admin';
import { db } from '../firebase/admin';
import { authenticationError, notFoundError, emailVerificationError } from '../utils/response';
import { USER_ROLE } from '@shared/constants/roles';
import type { User } from '@shared/types/user';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
  };
}

export async function authenticateUser(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: { uid: string; email?: string };
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Yetkilendirme token\'ı gerekli'
      };
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // ID token doğrulaması
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      }
    };
  } catch (error: unknown) {
    console.error('Auth middleware error:', error);
    return {
      authenticated: false,
      error: 'Geçersiz token'
    };
  }
}

// Helper function for protected routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: { uid: string; email?: string }) => Promise<NextResponse>,
  options?: { skipEmailVerification?: boolean }
): Promise<NextResponse> {
  const authResult = await authenticateUser(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return authenticationError(authResult.error || 'Kimlik doğrulaması gerekli');
  }
  
  // Email doğrulama kontrolü: kaldırıldı (tüm doğrulanmış kullanıcılar erişebilir)
  // (Önceden burada "emailVerified" kontrolü vardı ve doğrulanmamış kullanıcılara erişim engelleniyordu.)
  
  return handler(request, authResult.user);
}

/**
 * Firestore'dan kullanıcı bilgilerini getirir
 * @param uid Kullanıcı UID'si
 * @returns { error: NextResponse | null, user: User | null }
 * Error varsa error property'sinde NextResponse döner, yoksa user property'sinde user data döner
 */
export async function getCurrentUser(uid: string): Promise<{
  error: NextResponse | null;
  user: User | null;
}> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return { error: notFoundError('Kullanıcı'), user: null };
    }
    
    return { 
      error: null, 
      user: { uid, ...userDoc.data() } as User
    };
  } catch (error: unknown) {
    console.error('Get current user error:', error);
    return { 
      error: notFoundError('Kullanıcı'), 
      user: null 
    };
  }
}

