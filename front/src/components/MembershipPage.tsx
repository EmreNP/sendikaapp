import { ArrowLeft, UserPlus, Shield, BookOpen, User, Building2, MapPin, Phone, AlertCircle, FileText, Briefcase, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { IslamicTileBackground } from "./IslamicTileBackground";
import { CircularPersianMotif } from "./CircularPersianMotif";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";
import { useAuth, EducationLevel } from "../context/AuthContext";
import { branchService, Branch } from "../services/api";

interface MembershipPageProps {
  onBack: () => void;
  onLoginClick: () => void;
  onSuccess?: () => void;
}

const educationLevels: { id: EducationLevel; label: string }[] = [
  { id: "ilkokul", label: "İlkokul" },
  { id: "ortaokul", label: "Ortaokul" },
  { id: "lise", label: "Lise" },
  { id: "on_lisans", label: "Ön Lisans" },
  { id: "lisans", label: "Lisans" },
  { id: "yuksek_lisans", label: "Yüksek Lisans" },
  { id: "doktora", label: "Doktora" },
];

export function MembershipPage({ onBack, onLoginClick, onSuccess }: MembershipPageProps) {
  const { registerDetails, isLoading, error, clearError, user, isPendingDetails } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  
  const [formData, setFormData] = useState({
    // Personal - Step 2 detayları
    tcNo: "",
    fatherName: "",
    motherName: "",
    birthPlace: "",
    mobilePhone: "",
    
    // Education
    education: "" as EducationLevel | "",

    // Work
    institutionRegistryNo: "",
    title: "",
    titleCode: "",
    city: "",
    district: "",
    address: "",

    // Branch
    branchId: "",

    // Legal
    kvkkAccepted: false
  });

  // Şubeleri yükle
  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await branchService.getActiveBranches();
        setBranches(data);
      } catch (err) {
        console.error("Şubeler yüklenemedi:", err);
        toast.error("Şubeler yüklenirken hata oluştu");
      } finally {
        setLoadingBranches(false);
      }
    }
    loadBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData.branchId) {
      toast.error("Lütfen bir şube seçin");
      return;
    }

    if (!formData.kvkkAccepted) {
      toast.error("Lütfen KVKK metnini kabul edin");
      return;
    }

    try {
      await registerDetails({
        branchId: formData.branchId,
        tcKimlikNo: formData.tcNo || undefined,
        fatherName: formData.fatherName || undefined,
        motherName: formData.motherName || undefined,
        birthPlace: formData.birthPlace || undefined,
        education: formData.education as EducationLevel || undefined,
        kurumSicil: formData.institutionRegistryNo || undefined,
        kadroUnvani: formData.title || undefined,
        kadroUnvanKodu: formData.titleCode || undefined,
        phone: formData.mobilePhone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        district: formData.district || undefined,
      });

      toast.success("Üyelik başvurunuz alındı! Onay sürecini takip edebilirsiniz.");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Başvuru gönderilemedi");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 overflow-auto">
      <IslamicTileBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-blue-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Geri</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-gray-800 font-semibold">Üyelik Başvurusu</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-8 sm:px-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
               <CircularPersianMotif className="w-64 h-64 text-white" />
             </div>
             <div className="flex items-center gap-5 relative z-10">
               <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                 <FileText className="w-8 h-8 text-white" />
               </div>
               <div>
                 <h2 className="text-white text-2xl font-bold mb-1">Sendika Üyelik Formu</h2>
                 <p className="text-blue-100 text-sm max-w-xl">
                   Lütfen aşağıdaki formu eksiksiz doldurunuz. İşaretli (*) alanlar zorunludur.
                 </p>
               </div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
            
            {/* 1. Şube Seçimi (Zorunlu) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Şube Seçimi <span className="text-red-500">*</span></h3>
              </div>

              <div className="space-y-2">
                <Label>Bağlı Olacağınız Şube <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.branchId}
                  onValueChange={(val) => setFormData({...formData, branchId: val})}
                  disabled={loadingBranches}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingBranches ? "Şubeler yükleniyor..." : "Şube seçiniz"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 2. Üyelik Bilgileri (Personal Info) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Kişisel Bilgiler</h3>
              </div>

              {/* Kullanıcı bilgileri (read-only) */}
              {user && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Kayıtlı Bilgileriniz</p>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TC No */}
                <div className="space-y-2">
                  <Label htmlFor="tcNo">TC Kimlik No (11 Rakamlı)</Label>
                  <Input 
                    id="tcNo" 
                    maxLength={11}
                    value={formData.tcNo}
                    onChange={(e) => setFormData({...formData, tcNo: e.target.value.replace(/\D/g, '')})}
                    className="h-11 tracking-wider"
                    placeholder="___________"
                  />
                </div>
                {/* Baba Adı */}
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Baba Adı</Label>
                  <Input 
                    id="fatherName" 
                    value={formData.fatherName}
                    onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* Ana Adı */}
                <div className="space-y-2">
                  <Label htmlFor="motherName">Ana Adı</Label>
                  <Input 
                    id="motherName" 
                    value={formData.motherName}
                    onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* Doğum Yeri */}
                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Doğum Yeri</Label>
                  <Input 
                    id="birthPlace" 
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* Cep Telefonu */}
                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">Cep Telefonu</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      id="mobilePhone" 
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({...formData, mobilePhone: e.target.value})}
                      className="h-11 pl-9"
                      placeholder="05__ ___ __ __"
                    />
                  </div>
                </div>
              </div>

              {/* Öğrenim */}
              <div className="space-y-3 pt-2">
                <Label>Öğrenim Durumu</Label>
                <Select 
                  value={formData.education}
                  onValueChange={(val) => setFormData({...formData, education: val as EducationLevel})}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map(edu => (
                      <SelectItem key={edu.id} value={edu.id}>{edu.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. Kurum Bilgileri (Work Info) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Kurum Bilgileri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kurum Sicil */}
                <div className="space-y-2">
                  <Label htmlFor="institutionRegistryNo">Kurum Sicil No</Label>
                  <Input 
                    id="institutionRegistryNo" 
                    value={formData.institutionRegistryNo}
                    onChange={(e) => setFormData({...formData, institutionRegistryNo: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* Kadro Ünvanı */}
                <div className="space-y-2">
                  <Label htmlFor="title">Kadro Ünvanı</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* Kadro Ünvan Kodu */}
                <div className="space-y-2">
                  <Label htmlFor="titleCode">Kadro Ünvan Kodu</Label>
                  <Input 
                    id="titleCode" 
                    value={formData.titleCode}
                    onChange={(e) => setFormData({...formData, titleCode: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* İl */}
                <div className="space-y-2">
                  <Label htmlFor="city">İl</Label>
                  <Input 
                    id="city" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* İlçe */}
                <div className="space-y-2">
                  <Label htmlFor="district">İlçe</Label>
                  <Input 
                    id="district" 
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="h-11"
                  />
                </div>
                {/* Adres */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="h-11"
                    placeholder="Açık adresiniz"
                  />
                </div>
              </div>
            </div>

            {/* KVKK */}
            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 space-y-4">
               <div className="flex items-start gap-3">
                 <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                 <h3 className="font-medium text-gray-900">Kişisel Verilerin Korunması</h3>
               </div>
               <div className="text-sm text-gray-600 space-y-2 pl-8">
                 <p>
                   6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, paylaştığınız bilgiler sendika üyeliği işlemlerinin yürütülmesi amacıyla işlenecektir.
                 </p>
                 <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="kvkk"
                      checked={formData.kvkkAccepted}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, kvkkAccepted: checked as boolean })
                      }
                      className="mt-0.5"
                    />
                    <Label htmlFor="kvkk" className="text-sm cursor-pointer leading-snug">
                      KVKK Aydınlatma Metni'ni okudum ve kabul ediyorum. <span className="text-red-500">*</span>
                    </Label>
                 </div>
               </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.kvkkAccepted || isLoading || !formData.branchId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Başvuru Gönderiliyor...
                  </>
                ) : (
                  "Üyelik Başvurusu Yap"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
