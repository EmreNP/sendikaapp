// Protected Route utilities for state-based navigation
// Bu proje react-router kullanmadığı için, bu dosya helper fonksiyonları içerir

import { UserStatus, UserRole } from '../../context/AuthContext';

// Sayfa tipi - App.tsx ile uyumlu
export type PageType = 
  | 'home' 
  | 'login' 
  | 'signup' 
  | 'membership' 
  | 'pendingApproval' 
  | 'rejected'
  | 'courses' 
  | 'news' 
  | 'contact' 
  | 'branches';

// Kullanıcı durumuna göre yönlendirme sayfası belirleme
export function getPageByStatus(status: UserStatus | null, isAuthenticated: boolean): PageType {
  if (!isAuthenticated) {
    return 'home';
  }

  switch (status) {
    case 'pending_details':
      return 'membership';
    case 'pending_branch_review':
      return 'pendingApproval';
    case 'rejected':
      return 'rejected';
    case 'active':
      return 'home';
    default:
      return 'home';
  }
}

// Eğitimlere erişim kontrolü
export function canAccessTrainings(status: UserStatus | null): boolean {
  return status === 'active';
}

// Admin kontrolü
export function isAdminRole(role: UserRole | null): boolean {
  return role === 'admin';
}

// Branch Manager kontrolü
export function isBranchManagerRole(role: UserRole | null): boolean {
  return role === 'branch_manager';
}

// Staff kontrolü (admin veya branch_manager)
export function isStaffRole(role: UserRole | null): boolean {
  return role === 'admin' || role === 'branch_manager';
}

// Sayfa erişim kontrolü - belirli bir sayfaya erişim izni var mı?
export function canAccessPage(
  page: PageType, 
  status: UserStatus | null, 
  isAuthenticated: boolean
): boolean {
  // Herkes erişebilir
  const publicPages: PageType[] = ['home', 'news', 'branches', 'contact'];
  if (publicPages.includes(page)) {
    return true;
  }

  // Sadece giriş yapmamış kullanıcılar
  const guestPages: PageType[] = ['login', 'signup'];
  if (guestPages.includes(page)) {
    return !isAuthenticated;
  }

  // Giriş gerekli
  if (!isAuthenticated) {
    return false;
  }

  // Membership sayfası - pending_details için
  if (page === 'membership') {
    return status === 'pending_details';
  }

  // Onay bekleniyor sayfası
  if (page === 'pendingApproval') {
    return status === 'pending_branch_review';
  }

  // Reddedildi sayfası
  if (page === 'rejected') {
    return status === 'rejected';
  }

  // Eğitimler - sadece aktif kullanıcılar
  if (page === 'courses') {
    return status === 'active';
  }

  return false;
}

// Export default olarak getPageByStatus
export default getPageByStatus;
