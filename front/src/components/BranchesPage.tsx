import { useState, useEffect } from "react";
import { ChevronLeft, MapPin, Phone, Mail, Clock, Users, Calendar, BookOpen, Star, Search, Navigation, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { branchService, Branch } from "../services/api";

interface BranchesPageProps {
  onBack: () => void;
  onBranchSelect: (branchId: string) => void;
}

export function BranchesPage({ onBack, onBranchSelect }: BranchesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Şubeleri yükle
  useEffect(() => {
    async function loadBranches() {
      try {
        setLoading(true);
        const data = await branchService.getBranches();
        setBranches(data);
        setError(null);
      } catch (err: any) {
        console.error("Şubeler yüklenemedi:", err);
        setError(err.message || "Şubeler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (branch.city && branch.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (branch.district && branch.district.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Şubeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 mt-20">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-xl font-bold">Hata</h2>
          </div>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95"
              aria-label="Geri"
            >
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <h1 className="text-white tracking-tight" style={{ fontWeight: 700, fontSize: "clamp(1.25rem, 5vw, 1.5rem)" }}>
                Şubelerimiz
              </h1>
              <p className="text-blue-100 text-sm mt-0.5">
                {branches.length} şube ve temsilcilik
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Şube veya ilçe ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-0 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Branches List */}
      <div className="px-4 py-6 pb-24 space-y-3">
        {filteredBranches.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aradığınız kriterlere uygun şube bulunamadı.</p>
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => onBranchSelect(branch.id)}
              className="w-full bg-white rounded-2xl shadow-md border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden group"
            >
              {/* Header Section */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-slate-800" style={{ fontWeight: 700, fontSize: "clamp(1.05rem, 4.2vw, 1.175rem)" }}>
                        {branch.name}
                      </h2>
                      {branch.isMainBranch && (
                        <Badge variant="default" className="bg-blue-600 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Merkez
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{branch.district || branch.city}</span>
                    </div>
                  </div>
                  <Navigation className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Stats - optional */}
                {branch.memberCount !== undefined && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{branch.memberCount} üye</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="p-4 bg-slate-50 space-y-2.5">
                {branch.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-0.5">Telefon</p>
                      <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                        {branch.phone}
                      </p>
                    </div>
                  </div>
                )}

                {branch.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-0.5">E-posta</p>
                      <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 600 }}>
                        {branch.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-blue-600 text-sm text-center group-hover:text-blue-700 transition-colors" style={{ fontWeight: 600 }}>
                    Detayları Görüntüle →
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
