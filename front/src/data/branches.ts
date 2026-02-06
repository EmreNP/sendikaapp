export interface BranchContact {
  name: string;
  title: string;
  phone: string;
  email: string;
}

export interface WorkingHours {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export interface BranchStats {
  members: number;
  activities: number;
  courses: number;
}

export interface Branch {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  workingHours: WorkingHours;
  contact: BranchContact;
  stats: BranchStats;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isMainOffice?: boolean;
}

export const branchesData: Branch[] = [
  {
    id: 'merkez',
    name: 'Merkez Şube',
    district: 'Meram',
    address: 'Yeni Meram Caddesi No: 45/A, Meram, Konya',
    phone: '0332 350 12 34',
    email: 'merkez@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '08:00 - 18:00',
      saturday: '09:00 - 14:00',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Mehmet Yılmaz',
      title: 'Şube Müdürü',
      phone: '0332 350 12 35',
      email: 'mehmet.yilmaz@tdvsen-konya.org.tr',
    },
    stats: {
      members: 450,
      activities: 28,
      courses: 12,
    },
    coordinates: {
      lat: 37.8719,
      lng: 32.4844,
    },
    isMainOffice: true,
  },
  {
    id: 'selcuklu',
    name: 'Selçuklu Şubesi',
    district: 'Selçuklu',
    address: 'Alaaddin Bulvarı No: 78/B, Selçuklu, Konya',
    phone: '0332 235 67 89',
    email: 'selcuklu@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '08:30 - 17:30',
      saturday: '09:00 - 13:00',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Ahmet Demir',
      title: 'Şube Sorumlusu',
      phone: '0332 235 67 90',
      email: 'ahmet.demir@tdvsen-konya.org.tr',
    },
    stats: {
      members: 380,
      activities: 22,
      courses: 10,
    },
    coordinates: {
      lat: 37.8667,
      lng: 32.4922,
    },
  },
  {
    id: 'karatay',
    name: 'Karatay Şubesi',
    district: 'Karatay',
    address: 'Ankara Caddesi No: 156, Karatay, Konya',
    phone: '0332 342 45 67',
    email: 'karatay@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '08:00 - 18:00',
      saturday: '09:00 - 14:00',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Fatma Kaya',
      title: 'Şube Sorumlusu',
      phone: '0332 342 45 68',
      email: 'fatma.kaya@tdvsen-konya.org.tr',
    },
    stats: {
      members: 320,
      activities: 18,
      courses: 8,
    },
    coordinates: {
      lat: 37.8753,
      lng: 32.5089,
    },
  },
  {
    id: 'eregli',
    name: 'Ereğli Temsilciliği',
    district: 'Ereğli',
    address: 'Cumhuriyet Meydanı No: 23, Ereğli, Konya',
    phone: '0332 713 89 12',
    email: 'eregli@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '09:00 - 17:00',
      saturday: 'Kapalı',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Hasan Öztürk',
      title: 'Temsilci',
      phone: '0332 713 89 13',
      email: 'hasan.ozturk@tdvsen-konya.org.tr',
    },
    stats: {
      members: 180,
      activities: 12,
      courses: 5,
    },
    coordinates: {
      lat: 37.5133,
      lng: 34.0486,
    },
  },
  {
    id: 'beysehir',
    name: 'Beyşehir Temsilciliği',
    district: 'Beyşehir',
    address: 'Hükümet Caddesi No: 67, Beyşehir, Konya',
    phone: '0332 512 34 56',
    email: 'beysehir@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '09:00 - 17:00',
      saturday: 'Kapalı',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'İbrahim Şahin',
      title: 'Temsilci',
      phone: '0332 512 34 57',
      email: 'ibrahim.sahin@tdvsen-konya.org.tr',
    },
    stats: {
      members: 145,
      activities: 10,
      courses: 4,
    },
    coordinates: {
      lat: 37.6740,
      lng: 31.7242,
    },
  },
  {
    id: 'aksehir',
    name: 'Akşehir Temsilciliği',
    district: 'Akşehir',
    address: 'Nasreddin Hoca Meydanı No: 12, Akşehir, Konya',
    phone: '0332 813 45 78',
    email: 'aksehir@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '09:00 - 17:00',
      saturday: 'Kapalı',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Mustafa Arslan',
      title: 'Temsilci',
      phone: '0332 813 45 79',
      email: 'mustafa.arslan@tdvsen-konya.org.tr',
    },
    stats: {
      members: 165,
      activities: 11,
      courses: 6,
    },
    coordinates: {
      lat: 38.3575,
      lng: 31.4158,
    },
  },
  {
    id: 'cumra',
    name: 'Çumra Temsilciliği',
    district: 'Çumra',
    address: 'İstiklal Caddesi No: 89, Çumra, Konya',
    phone: '0332 415 67 89',
    email: 'cumra@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '09:00 - 17:00',
      saturday: 'Kapalı',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Zeynep Yıldırım',
      title: 'Temsilci',
      phone: '0332 415 67 90',
      email: 'zeynep.yildirim@tdvsen-konya.org.tr',
    },
    stats: {
      members: 125,
      activities: 9,
      courses: 4,
    },
    coordinates: {
      lat: 37.5742,
      lng: 32.7756,
    },
  },
  {
    id: 'seydisehir',
    name: 'Seydişehir Temsilciliği',
    district: 'Seydişehir',
    address: 'Atatürk Bulvarı No: 45, Seydişehir, Konya',
    phone: '0332 641 23 45',
    email: 'seydisehir@tdvsen-konya.org.tr',
    workingHours: {
      weekdays: '09:00 - 17:00',
      saturday: 'Kapalı',
      sunday: 'Kapalı',
    },
    contact: {
      name: 'Ali Çelik',
      title: 'Temsilci',
      phone: '0332 641 23 46',
      email: 'ali.celik@tdvsen-konya.org.tr',
    },
    stats: {
      members: 110,
      activities: 8,
      courses: 3,
    },
    coordinates: {
      lat: 37.4189,
      lng: 31.8500,
    },
  },
];

export const getBranchById = (id: string): Branch | undefined => {
  return branchesData.find(branch => branch.id === id);
};

export const getTotalMembers = (): number => {
  return branchesData.reduce((total, branch) => total + branch.stats.members, 0);
};

export const getTotalActivities = (): number => {
  return branchesData.reduce((total, branch) => total + branch.stats.activities, 0);
};

export const getTotalCourses = (): number => {
  return branchesData.reduce((total, branch) => total + branch.stats.courses, 0);
};
