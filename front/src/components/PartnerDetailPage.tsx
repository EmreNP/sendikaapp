
import { ArrowLeft, Clock, MapPin, Phone, Globe, Share2 } from "lucide-react";
import { partners } from "../data/partners";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PartnerDetailPageProps {
  partnerId: string;
  onBack: () => void;
}

export function PartnerDetailPage({ partnerId, onBack }: PartnerDetailPageProps) {
  const partner = partners.find((p) => p.id === partnerId);

  if (!partner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 animate-in slide-in-from-right duration-300">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 w-full shrink-0">
        <ImageWithFallback
          src={partner.coverUrl}
          alt={partner.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        
        {/* Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all active:scale-95 border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-3">
            <button className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all active:scale-95 border border-white/10">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="inline-block px-3 py-1 bg-blue-600 rounded-lg text-xs font-bold mb-3 shadow-lg shadow-blue-900/20">
            {partner.category}
          </div>
          <h1 className="text-3xl font-bold mb-2 leading-tight">{partner.name}</h1>
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <span className="px-2 py-0.5 border border-white/30 rounded text-xs font-medium">Anlaşmalı</span>
            <span>•</span>
            <span className="font-semibold text-white">{partner.discountRate} Fırsat</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-6 border border-slate-100/50">
          {/* Agreement Details */}
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Anlaşma Detayları
          </h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
            {partner.description}
          </p>

          <div className="my-6 border-t border-slate-100"></div>

          {/* Info Items (Mock data for display purposes) */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="bg-blue-100 text-blue-700 p-2.5 rounded-full shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Geçerlilik Süresi</h4>
                <p className="text-slate-500 text-sm">31 Aralık 2024 tarihine kadar</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-full shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">İletişim</h4>
                <p className="text-slate-500 text-sm">0850 123 45 67</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="bg-purple-100 text-purple-700 p-2.5 rounded-full shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Web Sitesi</h4>
                <p className="text-blue-600 text-sm underline">www.ornek-kurum.com</p>
              </div>
            </div>

             <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="bg-orange-100 text-orange-700 p-2.5 rounded-full shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Adres</h4>
                <p className="text-slate-500 text-sm">Merkez Mah. Atatürk Cad. No:123 Çankaya/Ankara</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4">
          <Phone className="w-5 h-5" />
          Hemen Ara
        </button>
      </div>
    </div>
  );
}
