
import { Upload, FileText, Image as ImageIcon, Send, X, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArrowLeft } from "lucide-react";

interface DistrictRepresentativePageProps {
  onBack: () => void;
}

export function DistrictRepresentativePage({ onBack }: DistrictRepresentativePageProps) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleFileUpload = (type: 'resignation' | 'membership') => {
    // Mock file upload
    toast.success(`${type === 'resignation' ? 'İstifa' : 'Üyelik'} formu başarıyla yüklendi`);
  };

  const handleImageUpload = () => {
    // Mock image upload
    const mockImage = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
    setImages([...images, mockImage]);
    toast.success("Fotoğraf eklendi");
  };

  const handleSubmitActivity = () => {
    if (!description && images.length === 0) {
      toast.error("Lütfen bir açıklama yazın veya fotoğraf ekleyin");
      return;
    }
    
    toast.success("Faaliyet başarıyla kaydedildi");
    setDescription("");
    setImages([]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 pt-12 pb-8 px-6 relative overflow-hidden shadow-xl shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide">İlçe İşyeri Temsilcisi</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        
        {/* Document Upload Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Üye Kayıt Bildirimi
          </h2>
          
          <div className="grid gap-4">
            <button 
              onClick={() => handleFileUpload('resignation')}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-medium text-slate-700">İstifa Formu Yükle</span>
              <span className="text-xs text-slate-400 mt-1">PDF veya Fotoğraf</span>
            </button>

            <button 
              onClick={() => handleFileUpload('membership')}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-medium text-slate-700">Üyelik Formu Yükle</span>
              <span className="text-xs text-slate-400 mt-1">PDF veya Fotoğraf</span>
            </button>
          </div>
        </div>

        {/* Activity Log Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Faaliyet Ekle
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Faaliyet açıklaması yazınız..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none text-sm"
              />
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <ImageWithFallback src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={handleImageUpload}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Fotoğraf Ekle
              </button>
              
              <button 
                onClick={handleSubmitActivity}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Kaydet
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
