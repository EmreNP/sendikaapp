import React, { useState, useEffect } from 'react';

const TermsPage: React.FC = () => {
  const [data, setData] = useState<{title?: string, lastUpdated?: string, content?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const backendUrl = import.meta.env.VITE_API_URL || 'https://tdvskonya-api-805647677578.europe-west1.run.app';
        const response = await fetch(`${backendUrl}/api/legal/terms`);
        if (!response.ok) throw new Error('Metin yüklenemedi');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Kullanım koşulları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error || 'İçerik bulunamadı'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
            {data.title || 'Kullanım Koşulları'}
          </h1>

          <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
            <p className="text-sm text-gray-500">
              Son Güncelleme Tarihi: {data.lastUpdated}
            </p>

            <div dangerouslySetInnerHTML={{ __html: data.content || '' }} />
          </div>
          
          <div className="mt-10 pt-6 border-t text-center space-x-4 flex justify-center">
            <a 
              href="/"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Ana Sayfa
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
