export type UserStatus = 
  | 'pending_details' 
  | 'pending_branch_review' 
  | 'active' 
  | 'rejected';

export const USER_STATUS = {
  PENDING_DETAILS: 'pending_details' as UserStatus,
  PENDING_BRANCH_REVIEW: 'pending_branch_review' as UserStatus,
  ACTIVE: 'active' as UserStatus,
  REJECTED: 'rejected' as UserStatus,
} as const;

