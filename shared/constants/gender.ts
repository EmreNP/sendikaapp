export type Gender = 'male' | 'female';

export const GENDER = {
  MALE: 'male' as Gender,
  FEMALE: 'female' as Gender,
} as const;

