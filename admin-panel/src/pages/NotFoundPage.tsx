import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-gray-600 mt-2">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Ana Sayfaya Git
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Eğer bu bir hata olduğunu düşünüyorsanız,</p>
          <p>lütfen sistem yöneticisi ile iletişime geçin.</p>
        </div>
      </div>
    </div>
  );
}
