
export interface Partner {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  coverUrl: string;
  discountRate: string;
  description: string;
  shortDescription: string;
}

export const partners: Partner[] = [
  {
    id: "1",
    name: "Özel Şifa Hastanesi",
    category: "Sağlık",
    logoUrl: "https://images.unsplash.com/photo-1769147555720-71fc71bfc216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGJ1aWxkaW5nJTIwbW9kZXJuJTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3Njk2OTk2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", // Using building as logo placeholder for now, usually logos are graphics
    coverUrl: "https://images.unsplash.com/photo-1769147555720-71fc71bfc216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGJ1aWxkaW5nJTIwbW9kZXJuJTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3Njk2OTk2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    discountRate: "%20 İndirim",
    shortDescription: "Tüm muayene ve tetkiklerde özel indirim.",
    description: "Sendikamız ile Özel Şifa Hastanesi arasında yapılan protokol gereği, üyelerimiz ve birinci derece yakınları, tüm muayene, tahlil ve tetkik işlemlerinden %20 indirimli olarak faydalanabileceklerdir. Anlaşma 2024 yılı sonuna kadar geçerlidir."
  },
  {
    id: "2",
    name: "Bilim Üniversitesi",
    category: "Eğitim",
    logoUrl: "https://images.unsplash.com/photo-1758413350790-560b73f26c04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwZWR1Y2F0aW9uJTIwbW9kZXJufGVufDF8fHx8MTc2OTY5OTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverUrl: "https://images.unsplash.com/photo-1758413350790-560b73f26c04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwZWR1Y2F0aW9uJTIwbW9kZXJufGVufDF8fHx8MTc2OTY5OTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    discountRate: "%15 Burs",
    shortDescription: "Yüksek lisans ve doktora programlarında özel burs imkanı.",
    description: "Bilim Üniversitesi ile yapılan işbirliği çerçevesinde, sendika üyelerimiz lisansüstü eğitim programlarında %15 özel burs imkanından yararlanabilecektir. Başvurular doğrudan üniversiteye üye kimlik kartı ile yapılmalıdır."
  },
  {
    id: "3",
    name: "Mavi Turizm",
    category: "Seyahat",
    logoUrl: "https://images.unsplash.com/photo-1529990131237-cfa5ce9517b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZ2VuY3klMjBhaXJwbGFuZSUyMGJ1c2luZXNzJTIwY2xhc3N8ZW58MXx8fHwxNzY5Njk5NjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverUrl: "https://images.unsplash.com/photo-1529990131237-cfa5ce9517b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZ2VuY3klMjBhaXJwbGFuZSUyMGJ1c2luZXNzJTIwY2xhc3N8ZW58MXx8fHwxNzY5Njk5NjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    discountRate: "%10 İndirim",
    shortDescription: "Yurt içi ve yurt dışı turlarda özel indirimler.",
    description: "Mavi Turizm acentesi ile yapılan anlaşma kapsamında, üyelerimize özel tüm paket turlarda %10 indirim uygulanacaktır. Erken rezervasyon fırsatlarıyla birleştiğinde avantajlar artmaktadır."
  },
  {
    id: "4",
    name: "Akademik Kitabevi",
    category: "Alışveriş",
    logoUrl: "https://images.unsplash.com/photo-1760246964044-1384f71665b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGV4dGVyaW9yJTIwY29ycG9yYXRlfGVufDF8fHx8MTc2OTY5OTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverUrl: "https://images.unsplash.com/photo-1760246964044-1384f71665b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGV4dGVyaW9yJTIwY29ycG9yYXRlfGVufDF8fHx8MTc2OTY5OTYwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    discountRate: "%25 İndirim",
    shortDescription: "Tüm yayınlarda geçerli ekstra indirim.",
    description: "Akademik Kitabevi mağazalarında ve online satış sitesinde, sendika üyelerimize özel %25 indirim tanımlanmıştır. Online alışverişlerde 'SENDIKA2024' kodunu kullanabilirsiniz."
  },
  {
    id: "5",
    name: "Konfor Mobilya",
    category: "Ev & Yaşam",
    logoUrl: "https://images.unsplash.com/photo-1758518730384-be3d205838e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBoYW5kc2hha2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY5Njk0NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverUrl: "https://images.unsplash.com/photo-1758518730384-be3d205838e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBoYW5kc2hha2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY5Njk0NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    discountRate: "%18 İndirim",
    shortDescription: "Ev mobilyalarında nakit ödemede özel fiyat.",
    description: "Konfor Mobilya ile evini yenilemek isteyen üyelerimiz için anlaşma sağladık. Nakit ödemelerde %18, taksitli alışverişlerde ise %10 indirim uygulanacaktır."
  }
];
