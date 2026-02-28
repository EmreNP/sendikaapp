import React, { useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle, AlertTriangle, Key, Mail } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';

const DeleteAccountPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (confirmText !== 'SİL') {
      setError('Lütfen onay kutusuna büyük harflerle SİL yazın.');
      return;
    }

    if (!email || !password) {
      setError('E-posta ve şifrenizi girmelisiniz.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Auth ile kullanıcının gerçekten kimliğini doğrula (Sign In)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Backend API çağrısı için Token alalım
      const idToken = await user.getIdToken();

      // 3. Backend Self-Deletion Endpoint'ini çağıralım
      const { api } = await import('@/config/api');
      const response = await fetch(api.url('api/users/me'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok || (data && data.success === false)) {
        throw new Error(data?.message || `Hesap silinemedi (Hata Kodu: ${response.status})`);
      }

      // 4. Son olarak istemci tarafında session'ı da temizleyelim
      await auth.signOut();

      // Başarılı durumu
      setSuccess(true);
      
    } catch (err: any) {
      console.error('Account deletion error:', err);
      // Firebase auth hata kodlarını anlaşılır türkçe mesajlara çevir
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-posta adresi veya şifreniz hatalı. Lütfen kontrol edin.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla başarısız deneme yaptınız. Lütfen daha sonra tekrar deneyin.');
      } else if (err.message && !err.message.includes('Firebase:')) {
        setError(err.message);
      } else {
        setError('Hesabınız silinirken bir sunucu hatası oluştu. Lütfen bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 w-full text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Hesabınız Başarıyla Silindi</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Hesabınız ve tüm kişisel verileriniz (KVKK ve Google Play Platform gereklilikleri kapsamında) sistemlerimizden kalıcı olarak silinmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.
          </p>
          <a
             href="/"
             className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-10 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full">
        {/* Header / Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hesap ve Veri Silme</h1>
          <p className="text-gray-500">TDVS Konya Mobil Uygulaması Veri Silme Portalı</p>
        </div>

        {/* Info Card */}
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm border-r border-t border-b mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Dikkat: Bu işlem kalıcıdır!</h3>
              <div className="mt-2 text-red-700 text-sm leading-relaxed space-y-2">
                <p>Hesabınızı ve bağlı tüm kişisel verilerinizi kalıcı olarak silmek üzeresiniz. Bu işlem şunları içerir:</p>
                <ul className="list-disc pl-5">
                  <li>Tüm kimlik, profil ve iletişim bilgilerinizi.</li>
                  <li>Yüklediğiniz üyelik dökümanları ve eğitim geçmişinizi.</li>
                  <li>Uygulama içi aktivite loglarınızı.</li>
                </ul>
                <p className="font-semibold underline mt-2">Bu işlem uygulandıktan sonra verileriniz TEKRAR KURTARILAMAZ.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleDelete} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-posta Adresiniz</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="kayitli@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şifreniz</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="******"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşlemi onaylamak için aşağıdaki kutuya <strong className="text-red-600">SİL</strong> yazın.
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm text-center font-bold tracking-wider"
                placeholder="SİL"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || confirmText !== 'SİL'}
              className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all ${
                isLoading || confirmText !== 'SİL' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent flex-shrink-0 animate-spin rounded-full"></div>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Hesabımı ve Verilerimi Kalıcı Olarak Sil
                </>
              )}
            </button>
            <p className="text-xs text-center text-gray-400 mt-4">
              Silme işlemi KVKK Madde 11'de belirtilen yasal haklarınıza istinaden işletilmektedir. Silinen hesaplarda üyelikler sonlanmış kabul edilir.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
