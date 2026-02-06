import { UserPlus, Mail, Lock, User, LogIn, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { IslamicTileBackground } from "./IslamicTileBackground";
import { CircularPersianMotif } from "./CircularPersianMotif";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { useAuth, Gender } from "../context/AuthContext";

interface SignupPageProps {
  onBack: () => void;
  onLoginClick: () => void;
  onRegistrationSuccess?: () => void;
}

export function SignupPage({ onBack, onLoginClick, onRegistrationSuccess }: SignupPageProps) {
  const { registerBasic, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    gender: "" as Gender | "",
    termsAccepted: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (!formData.termsAccepted) {
      toast.error("Lütfen kullanım koşullarını kabul edin");
      return;
    }

    if (!formData.gender) {
      toast.error("Lütfen cinsiyet seçin");
      return;
    }

    if (!formData.birthDate) {
      toast.error("Lütfen doğum tarihinizi girin");
      return;
    }

    try {
      await registerBasic({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate,
        gender: formData.gender as Gender,
      });
      
      toast.success("Hesabınız oluşturuldu! Şimdi üyelik bilgilerinizi tamamlayın.");
      
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Kayıt işlemi başarısız");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 z-0"></div>
      
      <div className="fixed inset-0 opacity-10 z-0 pointer-events-none">
        <IslamicTileBackground />
      </div>

      {/* Animated Ornaments */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-[500px] h-[500px] opacity-[0.07]"
        >
          <CircularPersianMotif className="w-full h-full text-white" />
        </motion.div>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "out" }}
        className="relative z-10 w-full max-w-lg my-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20">
          
          {/* Card Header */}
          <div className="relative bg-gradient-to-r from-indigo-800 to-blue-900 p-8 text-center overflow-hidden">
             <div className="absolute inset-0 opacity-10">
                <IslamicTileBackground />
             </div>
             <div className="relative z-10 flex flex-col items-center">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
                 <UserPlus className="w-8 h-8 text-white" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">Hesap Oluştur</h2>
               <p className="text-indigo-200 text-sm">Aramıza katılın ve avantajlardan yararlanın</p>
             </div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700 font-medium ml-1">Ad</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                      placeholder="Adınız"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700 font-medium ml-1">Soyad</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                      placeholder="Soyadınız"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium ml-1">E-posta</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              {/* Doğum Tarihi ve Cinsiyet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-slate-700 font-medium ml-1">Doğum Tarihi</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium ml-1">Cinsiyet</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                  >
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl">
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium ml-1">Şifre</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-medium ml-1">Şifre Tekrar</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-11 pl-10 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, termsAccepted: checked as boolean })
                  }
                  className="mt-0.5 data-[state=checked]:bg-indigo-600 border-indigo-200"
                />
                <Label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer font-normal leading-relaxed">
                  <span className="font-semibold text-indigo-700">Kullanım Koşulları</span>'nı ve <span className="font-semibold text-indigo-700">Gizlilik Politikası</span>'nı okudum, anladım ve kabul ediyorum.
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-800 hover:to-blue-900 text-white shadow-lg shadow-indigo-900/20 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Kayıt Yapılıyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Zaten hesabınız var mı?
              </p>
              <button
                onClick={onLoginClick}
                className="mt-2 flex items-center justify-center gap-2 mx-auto text-indigo-700 font-semibold hover:text-indigo-900 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Giriş Yap</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Footer */}
      <div className="mt-8 text-center relative z-10 pb-8">
        <p className="text-white/40 text-xs">
          © 2024 Türk Diyanet Vakıf-sen KONYA
        </p>
      </div>
    </div>
  );
}
