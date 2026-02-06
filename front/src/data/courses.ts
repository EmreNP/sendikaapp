export interface CourseContent {
  id: string;
  title: string;
  duration?: string;
  type: 'video' | 'document' | 'test';
  completed?: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  contents: CourseContent[];
  progress?: number;
}

export interface MainCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subCategories: SubCategory[];
  color: string;
}

export const coursesData: MainCategory[] = [
  {
    id: 'legislation',
    name: 'Mevzuat Dersleri',
    icon: 'Scale',
    description: 'Sendika mevzuatı ve hukuki düzenlemeler',
    color: 'blue',
    subCategories: [
      {
        id: 'labor-law',
        name: 'İş Hukuku',
        description: 'İş hukuku temel kavramları',
        progress: 65,
        contents: [
          { id: 'video1', title: 'İş Hukukuna Giriş', duration: '45 dk', type: 'video', completed: true },
          { id: 'video2', title: 'İş Sözleşmeleri', duration: '38 dk', type: 'video', completed: true },
          { id: 'doc1', title: 'İş Kanunu - Tam Metin', type: 'document', completed: false },
          { id: 'test1', title: 'İş Hukuku Değerlendirme Testi', type: 'test', completed: false },
        ],
      },
      {
        id: 'union-law',
        name: 'Sendika Hukuku',
        description: 'Sendika hakları ve yükümlülükleri',
        progress: 30,
        contents: [
          { id: 'video3', title: 'Sendika Özgürlüğü', duration: '42 dk', type: 'video', completed: true },
          { id: 'video4', title: 'Toplu İş Sözleşmesi', duration: '50 dk', type: 'video', completed: false },
          { id: 'doc2', title: 'Sendikalar Kanunu', type: 'document', completed: false },
          { id: 'test2', title: 'Sendika Hukuku Testi', type: 'test', completed: false },
        ],
      },
      {
        id: 'public-service',
        name: 'Kamu Görevlileri Hukuku',
        description: 'Kamu personel mevzuatı',
        progress: 0,
        contents: [
          { id: 'video5', title: 'Kamu Görevlileri Genel Esasları', duration: '55 dk', type: 'video', completed: false },
          { id: 'video6', title: 'Disiplin Hukuku', duration: '40 dk', type: 'video', completed: false },
          { id: 'doc3', title: 'Kamu Personel Rejimi Mevzuatı', type: 'document', completed: false },
          { id: 'test3', title: 'Kamu Hukuku Değerlendirme', type: 'test', completed: false },
        ],
      },
    ],
  },
  {
    id: 'theology',
    name: 'İlahiyat Dersleri',
    icon: 'BookMarked',
    description: 'İslami ilimler ve temel dini bilgiler',
    color: 'emerald',
    subCategories: [
      {
        id: 'quran',
        name: 'Kur\'an İlimleri',
        description: 'Kur\'an okuma ve tefsir dersleri',
        progress: 45,
        contents: [
          { id: 'video7', title: 'Tecvid Kuralları - Bölüm 1', duration: '35 dk', type: 'video', completed: true },
          { id: 'video8', title: 'Tecvid Kuralları - Bölüm 2', duration: '40 dk', type: 'video', completed: false },
          { id: 'video9', title: 'Kısa Sureler Tefsiri', duration: '60 dk', type: 'video', completed: false },
          { id: 'doc4', title: 'Tecvid Kuralları Özet', type: 'document', completed: true },
          { id: 'test4', title: 'Tecvid Bilgisi Testi', type: 'test', completed: false },
        ],
      },
      {
        id: 'hadith',
        name: 'Hadis İlimleri',
        description: 'Hadis bilgisi ve değerlendirme',
        progress: 20,
        contents: [
          { id: 'video10', title: 'Hadis İlmine Giriş', duration: '45 dk', type: 'video', completed: true },
          { id: 'video11', title: 'Kütüb-i Sitte', duration: '50 dk', type: 'video', completed: false },
          { id: 'doc5', title: 'Kırk Hadis Şerhi', type: 'document', completed: false },
          { id: 'test5', title: 'Hadis Bilgisi Testi', type: 'test', completed: false },
        ],
      },
      {
        id: 'fiqh',
        name: 'Fıkıh',
        description: 'İslam hukuku ve ibadetler',
        progress: 80,
        contents: [
          { id: 'video12', title: 'İbadetler Fıkhı', duration: '55 dk', type: 'video', completed: true },
          { id: 'video13', title: 'Muamelat Fıkhı', duration: '48 dk', type: 'video', completed: true },
          { id: 'video14', title: 'Güncel Fıkhi Meseleler', duration: '42 dk', type: 'video', completed: true },
          { id: 'doc6', title: 'Fıkıh Usulü Notları', type: 'document', completed: true },
          { id: 'test6', title: 'Fıkıh Kapsamlı Sınavı', type: 'test', completed: false },
        ],
      },
      {
        id: 'sirah',
        name: 'Siyer',
        description: 'Hz. Muhammed\'in hayatı',
        progress: 0,
        contents: [
          { id: 'video15', title: 'Mekke Dönemi', duration: '65 dk', type: 'video', completed: false },
          { id: 'video16', title: 'Medine Dönemi', duration: '70 dk', type: 'video', completed: false },
          { id: 'doc7', title: 'Siyer Kronolojisi', type: 'document', completed: false },
          { id: 'test7', title: 'Siyer Bilgisi Testi', type: 'test', completed: false },
        ],
      },
    ],
  },
  {
    id: 'arabic',
    name: 'Arapça Dersleri',
    icon: 'Languages',
    description: 'Arapça dil eğitimi ve okuma',
    color: 'amber',
    subCategories: [
      {
        id: 'beginner',
        name: 'Başlangıç Seviyesi',
        description: 'Arapça harfler ve temel gramer',
        progress: 90,
        contents: [
          { id: 'video17', title: 'Arapça Harfler', duration: '30 dk', type: 'video', completed: true },
          { id: 'video18', title: 'Hareke Sistemi', duration: '25 dk', type: 'video', completed: true },
          { id: 'video19', title: 'Temel Kelimeler', duration: '35 dk', type: 'video', completed: true },
          { id: 'doc8', title: 'Arapça Alfabe Kartları', type: 'document', completed: true },
          { id: 'test8', title: 'Başlangıç Seviye Testi', type: 'test', completed: true },
        ],
      },
      {
        id: 'intermediate',
        name: 'Orta Seviye',
        description: 'Gramer kuralları ve cümle yapısı',
        progress: 55,
        contents: [
          { id: 'video20', title: 'Fiil Çekimleri', duration: '45 dk', type: 'video', completed: true },
          { id: 'video21', title: 'İsim Cümleleri', duration: '40 dk', type: 'video', completed: true },
          { id: 'video22', title: 'Fiil Cümleleri', duration: '40 dk', type: 'video', completed: false },
          { id: 'doc9', title: 'Orta Seviye Gramer Özeti', type: 'document', completed: false },
          { id: 'test9', title: 'Orta Seviye Değerlendirme', type: 'test', completed: false },
        ],
      },
      {
        id: 'advanced',
        name: 'İleri Seviye',
        description: 'Metin okuma ve anlama',
        progress: 15,
        contents: [
          { id: 'video23', title: 'Arapça Metin Okuma', duration: '50 dk', type: 'video', completed: true },
          { id: 'video24', title: 'Klasik Metinler', duration: '55 dk', type: 'video', completed: false },
          { id: 'doc10', title: 'İleri Seviye Okuma Metinleri', type: 'document', completed: false },
          { id: 'test10', title: 'İleri Seviye Yeterlilik Sınavı', type: 'test', completed: false },
        ],
      },
    ],
  },
];
