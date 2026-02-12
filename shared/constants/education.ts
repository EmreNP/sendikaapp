export type EducationLevel = 'ilkogretim' | 'lise' | 'on_lisans' | 'lisans' | 'yuksek_lisans' | 'doktora';

export const EDUCATION_LEVEL = {
  ILKOGRETIM: 'ilkogretim' as EducationLevel,
  LISE: 'lise' as EducationLevel,
  ON_LISANS: 'on_lisans' as EducationLevel,
  LISANS: 'lisans' as EducationLevel,
  YUKSEK_LISANS: 'yuksek_lisans' as EducationLevel,
  DOKTORA: 'doktora' as EducationLevel,
} as const;

/** Eğitim seviyesi → Türkçe görünen isim eşlemesi */
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  ilkogretim: 'İlköğretim',
  lise: 'Lise',
  on_lisans: 'Ön Lisans',
  lisans: 'Lisans',
  yuksek_lisans: 'Yüksek Lisans',
  doktora: 'Doktora',
} as const;

/** Tüm eğitim seviyesi seçenekleri (select/dropdown için) */
export const EDUCATION_LEVEL_OPTIONS = Object.entries(EDUCATION_LEVEL_LABELS).map(
  ([value, label]) => ({ value: value as EducationLevel, label })
);

