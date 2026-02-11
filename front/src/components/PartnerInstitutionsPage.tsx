
import { ArrowLeft, Search, Building2 } from "lucide-react";
import { useState } from "react";
import { partners, Partner } from "../data/partners";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PartnerInstitutionsPageProps {
  onBack: () => void;
  onPartnerSelect: (partnerId: string) => void;
}

export function PartnerInstitutionsPage({ onBack, onPartnerSelect }: PartnerInstitutionsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  const categories = ["Tümü", ...Array.from(new Set(partners.map((p) => p.category)))];

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || partner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 pt-12 pb-24 px-6 relative overflow-hidden shadow-xl">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wide">Anlaşmalı Kurumlar</h1>
        </div>

        {/* Search Bar */}
        <div className="relative z-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200 w-5 h-5" />
            <input
              type="text"
              placeholder="Kurum ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-blue-200 pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 -mt-16 px-4 pb-6 z-20 relative">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 -mx-4 px-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === category
                  ? "bg-white text-blue-900 shadow-md ring-2 ring-blue-900/10 scale-105"
                  : "bg-white/80 text-slate-600 hover:bg-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPartners.map((partner) => (
            <button
              key={partner.id}
              onClick={() => onPartnerSelect(partner.id)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4 text-left hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-slate-100">
                <ImageWithFallback
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 shadow-sm">
                  {partner.discountRate}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                    {partner.category}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-700 transition-colors">
                  {partner.name}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {partner.shortDescription}
                </p>
              </div>
            </button>
          ))}

          {filteredPartners.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8" />
              </div>
              <p className="font-medium">Arama kriterlerine uygun kurum bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
