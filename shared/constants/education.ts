export type EducationLevel = 'ilkögretim' | 'lise' | 'yüksekokul';

export const EDUCATION_LEVEL = {
  ILKOGRETIM: 'ilkögretim' as EducationLevel,
  LISE: 'lise' as EducationLevel,
  YUKSEKOKUL: 'yüksekokul' as EducationLevel,
} as const;

