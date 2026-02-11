import { Eye, EyeOff, Lock, Mail, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { IslamicTileBackground } from "./IslamicTileBackground";
import { CircularPersianMotif } from "./CircularPersianMotif";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface LoginPageProps {
  onBack: () => void;
  onSignupClick: () => void;
  onLoginSuccess: () => void;
}

export function LoginPage({ onBack, onSignupClick, onLoginSuccess }: LoginPageProps) {
  const { login, isLoading, error, clearError, status } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(loginData.email, loginData.password);
      toast.success("Giriş başarılı!");
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || "Giriş yapılamadı");
    }
  };

  const fillMockData = () => {
    setLoginData({
      email: "ahmet.yilmaz@ornek.com",
      password: "password123",
      rememberMe: true
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-0"></div>
      
      <div className="fixed inset-0 opacity-10 z-0 pointer-events-none">
        <IslamicTileBackground />
      </div>

      {/* Animated Ornaments */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 opacity-10"
        >
          <CircularPersianMotif className="w-full h-full text-white" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -left-24 w-80 h-80 opacity-10"
        >
          <CircularPersianMotif className="w-full h-full text-amber-500" />
        </motion.div>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "out" }}
        className="relative z-10 w-full max-w-md my-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20">
          {/* Card Header */}
          <div className="relative bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-center overflow-hidden">
             <div className="absolute inset-0 opacity-10">
                <IslamicTileBackground />
             </div>
             <div className="relative z-10 flex flex-col items-center">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
                 <LogIn className="w-8 h-8 text-white" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">Hoş Geldiniz</h2>
               <p className="text-blue-200 text-sm">Türk Diyanet Vakıf-sen Üye Paneli</p>
             </div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium ml-1">E-posta Adresi</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="ornek@email.com"
                    className="h-12 pl-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-700 font-medium">Şifre</Label>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
                    Şifremi Unuttum?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-1">
                <Checkbox
                  id="remember"
                  checked={loginData.rememberMe}
                  onCheckedChange={(checked) => 
                    setLoginData({ ...loginData, rememberMe: checked as boolean })
                  }
                  className="data-[state=checked]:bg-blue-600 border-slate-300"
                />
                <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-normal">
                  Beni hatırla
                </Label>
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white shadow-lg shadow-blue-900/20 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={fillMockData}
                  className="w-full py-2 text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors border border-dashed border-slate-300 rounded-lg hover:bg-blue-50"
                >
                  Demo Hesabı ile Doldur
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Henüz hesabınız yok mu?
              </p>
              <button
                onClick={onSignupClick}
                className="mt-2 flex items-center justify-center gap-2 mx-auto text-blue-700 font-semibold hover:text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Hemen Kayıt Ol</span>
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
