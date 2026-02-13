export interface MuktesepFormData {
  imamHatipLisesi: boolean;
  onLisans: boolean;
  digerLisans: boolean;
  ilahiyatFakultesi: boolean;
  yuksekLisans: boolean;
  hafizlik: boolean;
  ihtisasKursu: boolean;
  tashihHuruf: boolean;
  ydsBelgesi: boolean;
  hizmetYili: string;   // UI'dan geliyor
  mbstsScore: string;   // UI'dan geliyor (0-100)
}

export interface CalculationResult {
  totalScore: number;
  muktesepScore: number;        // (education+service+certificates)*0.2
  mbstsScore: number;           // kullanıcı girişi (0-100)
  requiredOralScore: number;    // UI'daki "Gerekli Sözlü Puanı" (puan cinsinden)
  mbsts40Percent: number;       // mbstsScore*0.4
  currentTotalWithMBSTS: number;// muktesepScore + mbsts40Percent
  sozluYuzde: number;           // sözlüden alınması gereken yüzde (puan/0.4)
  breakdown: {
    education: number;
    service: number;
    certificates: number;
  };
  recommendations: string[];
}

export type CalculationError =
  | { ok: false; code: "INVALID_MBSTS"; message: string }
  | { ok: false; code: "INVALID_HIZMET"; message: string };

export type CalculationOk = { ok: true; result: CalculationResult };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * UI'dan bağımsız saf hesaplama fonksiyonu.
 * Ekrandaki mantıkla birebir aynı sonuçları üretir.
 */
export function calculateMuktesep(
  formData: MuktesepFormData,
  opts?: { minimumTotal?: number }
): CalculationOk | CalculationError {
  const minimumTotal = opts?.minimumTotal ?? 70;

  // MBSTS validasyonu
  const mbsts = parseFloat(formData.mbstsScore);
  if (Number.isNaN(mbsts) || mbsts < 0 || mbsts > 100) {
    return {
      ok: false,
      code: "INVALID_MBSTS",
      message: "MBSTS puanı 0-100 arasında olmalıdır.",
    };
  }

  // Hizmet yılı parse (negatifse engelleyelim)
  const hizmetYili = parseInt(formData.hizmetYili, 10);
  const hizmet = Number.isNaN(hizmetYili) ? 0 : hizmetYili;
  if (hizmet < 0) {
    return {
      ok: false,
      code: "INVALID_HIZMET",
      message: "Hizmet yılı negatif olamaz.",
    };
  }

  // Eğitim puanları
  let educationScore = 0;
  if (formData.imamHatipLisesi) educationScore += 10;
  if (formData.onLisans) educationScore += 5;
  if (formData.digerLisans) educationScore += 5;
  if (formData.ilahiyatFakultesi) educationScore += 10;
  if (formData.yuksekLisans) educationScore += 2;

  // Sertifika/Belge puanları
  let certificatesScore = 0;
  if (formData.hafizlik) certificatesScore += 8;
  if (formData.ihtisasKursu) certificatesScore += 5;
  if (formData.tashihHuruf) certificatesScore += 3;
  if (formData.ydsBelgesi) certificatesScore += 2;

  // Hizmet puanı: 10 yıla kadar 3 puan/yıl, sonrası 1 puan/yıl
  let serviceScore = 0;
  if (hizmet > 0) {
    if (hizmet <= 10) serviceScore = hizmet * 3;
    else serviceScore = 30 + (hizmet - 10) * 1;
  }

  // Müktesep %20
  const muktesepBaseScore = educationScore + serviceScore + certificatesScore;
  const muktesepScore = round2(muktesepBaseScore * 0.2);

  // MBSTS %40 (ekrandaki davranışa göre ham MBSTS'in %40'ı)
  const mbsts40Percent = round2(mbsts * 0.4);

  // Mevcut toplam (Müktesep + MBSTS)
  const currentTotalWithMBSTS = round2(muktesepScore + mbsts40Percent);

  // 70 barajı için gereken ek puan (sözlüden alınması gereken puan, puan cinsinden)
  const needed = round2(Math.max(0, minimumTotal - currentTotalWithMBSTS));

  // UI'daki mantığa göre:
  // - "Gerekli Sözlü Puanı" = needed (puan cinsinden)
  // - "Sözlü yüzdesi" = needed / 0.4  (çünkü sözlü final puanına %40 etkili)
  const requiredOralScore = needed;
  const sozluYuzde = round2(requiredOralScore / 0.4);

  const recommendations: string[] = [];
  if (muktesepScore < 10) {
    recommendations.push(
      "Müktesep puanınızı artırmak için ek eğitim ve belgeler almayı düşünebilirsiniz."
    );
  }
  if (hizmet < 5) {
    recommendations.push("Hizmet sürenizi artırmak puanınızı önemli ölçüde yükseltecektir.");
  }
  if (!formData.ilahiyatFakultesi && !formData.imamHatipLisesi) {
    recommendations.push("İlahiyat Fakültesi veya İmam Hatip Lisesi eğitimi almak puanınızı artıracaktır.");
  }

  const result: CalculationResult = {
    totalScore: round2(currentTotalWithMBSTS + requiredOralScore),
    muktesepScore,
    mbstsScore: mbsts,
    requiredOralScore,
    mbsts40Percent,
    currentTotalWithMBSTS,
    sozluYuzde,
    breakdown: {
      education: educationScore,
      service: serviceScore,
      certificates: certificatesScore,
    },
    recommendations,
  };

  return { ok: true, result };
}
