import { ChevronLeft, MapPin, Phone, Mail, Clock, User, Users, Calendar, BookOpen, Navigation2, Copy, CheckCircle2 } from "lucide-react";
import { getBranchById } from "../data/branches";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useState } from "react";

interface BranchDetailPageProps {
  branchId: string;
  onBack: () => void;
}

export function BranchDetailPage({ branchId, onBack }: BranchDetailPageProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const branch = getBranchById(branchId);

  if (!branch) {
    return null;
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openInMaps = () => {
    if (branch.coordinates) {
      window.open(`https://www.google.com/maps?q=${branch.coordinates.lat},${branch.coordinates.lng}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95"
              aria-label="Geri"
            >
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-white tracking-tight leading-tight" style={{ fontWeight: 700, fontSize: "clamp(1.125rem, 4.5vw, 1.375rem)" }}>
                  {branch.name}
                </h1>
                {branch.isMainOffice && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    Merkez
                  </Badge>
                )}
              </div>
              <p className="text-blue-100 text-sm">
                {branch.district} İlçesi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24 space-y-4">
        {/* Statistics Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
          <h2 className="text-slate-800 mb-4" style={{ fontWeight: 700, fontSize: "clamp(1rem, 4vw, 1.125rem)" }}>
            İstatistikler
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-blue-600" strokeWidth={2} />
              </div>
              <div className="text-slate-800" style={{ fontWeight: 700, fontSize: "clamp(1.25rem, 5vw, 1.5rem)" }}>
                {branch.stats.members}
              </div>
              <div className="text-slate-600 text-xs mt-1">Üye Sayısı</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-emerald-600" strokeWidth={2} />
              </div>
              <div className="text-slate-800" style={{ fontWeight: 700, fontSize: "clamp(1.25rem, 5vw, 1.5rem)" }}>
                {branch.stats.activities}
              </div>
              <div className="text-slate-600 text-xs mt-1">Etkinlik</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-amber-600" strokeWidth={2} />
              </div>
              <div className="text-slate-800" style={{ fontWeight: 700, fontSize: "clamp(1.25rem, 5vw, 1.5rem)" }}>
                {branch.stats.courses}
              </div>
              <div className="text-slate-600 text-xs mt-1">Eğitim</div>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
          <h2 className="text-slate-800 mb-4" style={{ fontWeight: 700, fontSize: "clamp(1rem, 4vw, 1.125rem)" }}>
            İletişim Bilgileri
          </h2>
          <div className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Adres</p>
                <p className="text-slate-800 text-sm leading-relaxed">
                  {branch.address}
                </p>
                {branch.coordinates && (
                  <button
                    onClick={openInMaps}
                    className="mt-2 flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Navigation2 className="w-4 h-4" />
                    Haritada Aç
                  </button>
                )}
              </div>
            </div>

            <Separator />

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Telefon</p>
                <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                  {branch.phone}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(branch.phone, 'phone')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                aria-label="Telefonu kopyala"
              >
                {copiedField === 'phone' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            <Separator />

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-purple-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">E-posta</p>
                <p className="text-slate-800 text-sm break-all" style={{ fontWeight: 600 }}>
                  {branch.email}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(branch.email, 'email')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                aria-label="E-postayı kopyala"
              >
                {copiedField === 'email' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Working Hours Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
          <h2 className="text-slate-800 mb-4" style={{ fontWeight: 700, fontSize: "clamp(1rem, 4vw, 1.125rem)" }}>
            Çal��şma Saatleri
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" strokeWidth={2} />
                <span className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                  Hafta İçi
                </span>
              </div>
              <span className="text-slate-600 text-sm">
                {branch.workingHours.weekdays}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                <span className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                  Cumartesi
                </span>
              </div>
              <span className="text-slate-600 text-sm">
                {branch.workingHours.saturday}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" strokeWidth={2} />
                <span className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                  Pazar
                </span>
              </div>
              <span className="text-slate-600 text-sm">
                {branch.workingHours.sunday}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Manager Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
          <h2 className="text-slate-800 mb-4" style={{ fontWeight: 700, fontSize: "clamp(1rem, 4vw, 1.125rem)" }}>
            Şube Sorumlusu
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-800 mb-1" style={{ fontWeight: 700, fontSize: "clamp(1rem, 4vw, 1.125rem)" }}>
                  {branch.contact.name}
                </h3>
                <p className="text-blue-600 text-sm mb-3" style={{ fontWeight: 600 }}>
                  {branch.contact.title}
                </p>
                
                <Separator className="mb-3" />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{branch.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 break-all">{branch.contact.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${branch.phone}`}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <Phone className="w-6 h-6" strokeWidth={2} />
            <span className="text-sm" style={{ fontWeight: 600 }}>Ara</span>
          </a>
          <a
            href={`mailto:${branch.email}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <Mail className="w-6 h-6" strokeWidth={2} />
            <span className="text-sm" style={{ fontWeight: 600 }}>E-posta Gönder</span>
          </a>
        </div>
      </div>
    </div>
  );
}
