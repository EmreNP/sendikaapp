export type UserRole = 'admin' | 'branch_manager' | 'user';

export const USER_ROLE = {
  ADMIN: 'admin' as UserRole,
  BRANCH_MANAGER: 'branch_manager' as UserRole,
  USER: 'user' as UserRole,
} as const;

