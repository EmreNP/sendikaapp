
import { useState } from "react";
import { ArrowLeft, Calculator, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MuktesepPageProps {
  onBack: () => void;
}

interface EducationOption {
  id: string;
  title: string;
  points: number;
}

interface CertificateOption {
  id: string;
  title: string;
  points: number;
}

const educationOptions: EducationOption[] = [
  { id: "imam-hatip", title: "İmam Hatip Lisesi", points: 10 },
  { id: "ilahiyat-onlisans", title: "İlahiyat Önlisans", points: 5 },
  { id: "alan-disi-lisans", title: "Alan Dışı Lisans", points: 5 },
  { id: "ilahiyat-fakultesi", title: "İlahiyat Fakültesi", points: 10 },
  { id: "yuksek-lisans", title: "Yüksek Lisans", points: 2 },
];

const certificateOptions: CertificateOption[] = [
  { id: "hafizlik", title: "Hafızlık", points: 8 },
  { id: "ihtisas", title: "İhtisas Kursu", points: 5 },
  { id: "tashih", title: "Tashih-i Huruf", points: 3 },
  { id: "yds", title: "YDS Belgesi", points: 2 },
];

export function MuktesepPage({ onBack }: MuktesepPageProps) {
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [serviceYears, setServiceYears] = useState<string>("");
  const [mbstsScore, setMbstsScore] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(0);

  const toggleEducation = (id: string) => {
    setSelectedEducation((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCertificate = (id: string) => {
    setSelectedCertificates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCalculate = () => {
    // 1. Education Points
    const educationPoints = selectedEducation.reduce((total, id) => {
      const option = educationOptions.find((opt) => opt.id === id);
      return total + (option?.points || 0);
    }, 0);

    // 2. Certificate Points
    const certificatePoints = selectedCertificates.reduce((total, id) => {
      const option = certificateOptions.find((opt) => opt.id === id);
      return total + (option?.points || 0);
    }, 0);

    // 3. Service Points
    const years = parseInt(serviceYears) || 0;
    let servicePoints = 0;
    if (years <= 10) {
      servicePoints = years * 3;
    } else {
      servicePoints = (10 * 3) + ((years - 10) * 1);
    }

    // 4. MBSTS Points
    const mbsts = parseFloat(mbstsScore) || 0;
    const mbstsPoints = mbsts * 0.40;

    const total = educationPoints + certificatePoints + servicePoints + mbstsPoints;
    setCalculatedScore(total);
    setShowResult(true);
    
    // Scroll to top to see result or show a nice modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success("Hesaplama tamamlandı!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 pt-12 pb-8 px-6 relative overflow-hidden shadow-xl shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wide">Muktesep Hesaplama</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {showResult && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-600 animate-in fade-in slide-in-from-top-4 mb-6">
            <h3 className="text-center text-slate-500 font-medium mb-2">Toplam Puanınız</h3>
            <div className="text-5xl font-bold text-center text-blue-900 mb-4">
              {calculatedScore.toFixed(2)}
            </div>
            <div className="flex justify-center">
               <button 
                onClick={() => setShowResult(false)}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Yeni Hesaplama Yap
              </button>
            </div>
          </div>
        )}

        {/* Education Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Eğitim Durumu</h2>
          <div className="space-y-3">
            {educationOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleEducation(option.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center group ${
                  selectedEducation.includes(option.id)
                    ? "bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10"
                    : "bg-white border-slate-200 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className={`font-medium ${selectedEducation.includes(option.id) ? "text-blue-800" : "text-slate-700"}`}>
                    {option.title}
                  </div>
                  <div className={`text-xs ${selectedEducation.includes(option.id) ? "text-blue-600" : "text-slate-500"}`}>
                    {option.points} puan
                  </div>
                </div>
                {selectedEducation.includes(option.id) && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Certificates Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Sertifikalar ve Belgeler</h2>
          <div className="space-y-3">
            {certificateOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleCertificate(option.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center group ${
                  selectedCertificates.includes(option.id)
                    ? "bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10"
                    : "bg-white border-slate-200 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className={`font-medium ${selectedCertificates.includes(option.id) ? "text-blue-800" : "text-slate-700"}`}>
                    {option.title}
                  </div>
                  <div className={`text-xs ${selectedCertificates.includes(option.id) ? "text-blue-600" : "text-slate-500"}`}>
                    {option.points} puan
                  </div>
                </div>
                {selectedCertificates.includes(option.id) && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Service Years Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Hizmet Süresi</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Hizmet Yılı</label>
            <input
              type="number"
              min="0"
              max="40"
              value={serviceYears}
              onChange={(e) => setServiceYears(e.target.value)}
              placeholder="Hizmet yılınızı giriniz (0-40 yıl arası)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <span>10 yıla kadar her yıl 3 puan, sonrası her yıl 1 puan</span>
            </div>
            <div className="flex gap-2">
              <Calculator className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Örnek: 5 yıl = 15 puan, 10 yıl = 30 puan, 15 yıl = 35 puan</span>
            </div>
          </div>
        </div>

        {/* MBSTS Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">MBSTS Puanı</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">MBSTS Puanınız</label>
            <input
              type="number"
              min="0"
              max="100"
              value={mbstsScore}
              onChange={(e) => setMbstsScore(e.target.value)}
              placeholder="MBSTS sınavından aldığınız puanı giriniz"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2">
            <div className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              <span>MBSTS puanı, sınav sonucunuzda yer alan puanı giriniz</span>
            </div>
            <div className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              <span>Bu puan toplam puanınızın %40'ını oluşturur</span>
            </div>
            <div className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              <span>Örnek: 80 puan = 32 puan (%40)</span>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg py-4 rounded-lg shadow-lg active:scale-[0.98] transition-all uppercase tracking-wide"
        >
          HESAPLA
        </button>
      </div>
    </div>
  );
}
