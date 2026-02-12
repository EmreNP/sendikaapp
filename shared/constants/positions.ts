// Kadro Ünvanları
export const POSITIONS = [
  'Vaiz',
  'Şube Müdürü',
  'Murakıp',
  'Din hizmetleri uzmanı',
  'Şef',
  'Tekniker',
  'Kuran Kursu Öğreticisi',
  'Teknisyen',
  'İmam-Hatip',
  'Veri Hazırlama ve Kontrol İşletmeni',
  'Memur',
  'Müezzin Kayyım',
  'Bekçi',
  'Hizmetli',
  'Şöför',
  'Manevi Danışman',
  'Vakıf Çalışanı',
  'Diyanet Akademi Aday Görevli',
  'Öğrenci',
  'Diğer',
] as const;

export type Position = typeof POSITIONS[number];
