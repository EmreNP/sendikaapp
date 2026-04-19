import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

const PrivacyPage: React.FC = () => {
  const [data, setData] = useState<{title?: string, lastUpdated?: string, content?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/legal/privacy`);
        if (!response.ok) throw new Error('Metin yüklenemedi');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Gizlilik politikası yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrivacy();
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
    <div className="min-h-screen bg-gray-50 flex flex-col py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title || 'Gizlilik Politikası'}</h1>
          <p className="text-gray-500">Son Güncelleme: {data.lastUpdated}</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
          <a 
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Ana Sayfa
          </a>
          <p className="text-sm text-gray-500">
            Bu metin KVKK (Kişisel Verilerin Korunması Kanunu) ve Google Play Platform İlkeleri'ne tam uyumlu olarak hazırlanmıştır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
