export type EducationLevel = 'ilkogretim' | 'lise' | 'yuksekokul';

export const EDUCATION_LEVEL = {
  ILKOGRETIM: 'ilkogretim' as EducationLevel,
  LISE: 'lise' as EducationLevel,
  YUKSEKOKUL: 'yuksekokul' as EducationLevel,
} as const;

/** Eğitim seviyesi → Türkçe görünen isim eşlemesi */
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  ilkogretim: 'İlköğretim',
  lise: 'Lise',
  yuksekokul: 'Yüksekokul',
} as const;

/** Tüm eğitim seviyesi seçenekleri (select/dropdown için) */
export const EDUCATION_LEVEL_OPTIONS = Object.entries(EDUCATION_LEVEL_LABELS).map(
  ([value, label]) => ({ value: value as EducationLevel, label })
);

