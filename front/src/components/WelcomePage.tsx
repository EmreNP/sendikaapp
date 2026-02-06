// Welcome Page - Giriş yapmamış kullanıcılar için karşılama ekranı

import { motion } from 'motion/react';
import { LogIn, UserPlus, Building2, Users, BookOpen, Shield } from 'lucide-react';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logo from "figma:asset/35bb759bf7f965cc9346946264a06771442bcc70.png";

interface WelcomePageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export function WelcomePage({ onLoginClick, onSignupClick }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-28 h-28 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/30">
              <ImageWithFallback
                src={logo}
                alt="Türk Diyanet Vakıf-sen Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Türk Diyanet Vakıf-Sen
            </h1>
            <p className="text-blue-200 text-lg">Konya Şubesi</p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 gap-4 mb-10 max-w-sm"
          >
            <div className="flex items-center gap-3 text-blue-100">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-sm">Eğitimler</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-sm">Şubeler</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm">Topluluk</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-sm">Haklarınız</span>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-sm space-y-4"
          >
            {/* Login Button */}
            <button
              onClick={onLoginClick}
              className="w-full py-4 px-6 bg-white text-blue-900 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02]"
            >
              <LogIn className="w-5 h-5" />
              Giriş Yap
            </button>

            {/* Signup Button */}
            <button
              onClick={onSignupClick}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] border-2 border-blue-400"
            >
              <UserPlus className="w-5 h-5" />
              Kayıt Ol
            </button>
          </motion.div>

          {/* Info text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-blue-200/70 text-sm text-center mt-8 max-w-xs"
          >
            Sendika üyesi olmak için kayıt olduktan sonra üyelik başvurunuzu tamamlayabilirsiniz.
          </motion.p>
        </div>

        {/* Footer */}
        <div className="py-6 text-center">
          <p className="text-blue-300/50 text-xs">
            © 2026 Türk Diyanet Vakıf-Sen Konya Şubesi
          </p>
        </div>
      </div>
    </div>
  );
}
