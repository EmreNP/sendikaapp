export type UserRole = 'admin' | 'branch_manager' | 'user';

export type UserStatus = 
  | 'pending_details' 
  | 'pending_branch_review' 
  | 'active' 
  | 'rejected';

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  branchId?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

