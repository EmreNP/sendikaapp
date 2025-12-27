// Re-export shared types
export type { 
  User, 
  UserStatus, 
  UserRole, 
  Gender, 
  EducationLevel,
  RegisterBasicRequest,
  RegisterDetailsRequest
} from '@shared/types/user';

export type { Branch } from '@shared/types/branch';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  RegisterBasic: undefined;
  RegisterDetails: undefined;
  Status: undefined;
};

