import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authService.signIn(email, password);
      setUser(user);
      
      // Role'e göre yönlendir (superadmin de admin dashboard'a yönlendirilir)
      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'branch_manager') {
        navigate('/branch/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SendikaApp Yönetim Paneli
          </h1>
          <p className="text-gray-600">
            Admin ve İlçe Temsilcisi Girişi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Roller */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Shield className="w-5 h-5 text-slate-700" />
              <div>
                <div className="text-xs text-slate-700 font-medium">Admin</div>
                <div className="text-xs text-gray-500">Tam Yetki</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="w-5 h-5 text-slate-700" />
              <div>
                <div className="text-xs text-slate-700 font-medium">Şube Yön.</div>
                <div className="text-xs text-gray-500">Şube Yetki</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-900">Giriş Başarısız</div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                Bu panel sadece <span className="font-semibold">Admin</span> ve{' '}
                <span className="font-semibold">Şube Yöneticileri</span> için tasarlanmıştır.
                Normal kullanıcılar mobil uygulama üzerinden işlem yapabilir.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 SendikaApp. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}

