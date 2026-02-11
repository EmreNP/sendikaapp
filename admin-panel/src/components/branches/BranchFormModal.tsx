import { useEffect, useState, useCallback, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { apiRequest } from '@/utils/api';
import { logger } from '@/utils/logger';

interface Branch {
  id: string;
  name: string;
  desc?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: {
    weekday?: string;
    saturday?: string;
    sunday?: string;
  };
  isActive?: boolean;
}

interface BranchFormModalProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBranch?: Branch) => void;
}

// Google Maps container style
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 41.0082, // İstanbul
  lng: 28.9784,
};

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ['places'];

export default function BranchFormModal({ branch, isOpen, onClose, onSuccess }: BranchFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    location: null as { latitude: number; longitude: number } | null,
    address: '',
    phone: '',
    email: '',
    workingHours: {
      weekday: '',
      saturday: '',
      sunday: '',
    },
    isActive: true,
  });
  
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const isEditMode = !!branch;

  // Reverse Geocoding - Koordinattan adres alma
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        logger.warn('Google Maps API key not found');
        return '';
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=tr&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        // En uygun adresi döndür (genelde ilk sonuç)
        return data.results[0].formatted_address;
      }
      return '';
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      return '';
    }
  };

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // useLoadScript hook'u - script'i sadece bir kez yükler
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Haritaya tıklama - koordinat seçme
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setSelectedLocation({ lat, lng });
    setFormData(prev => ({
      ...prev,
      location: { latitude: lat, longitude: lng },
    }));
    
    // Reverse geocoding ile adres al
    setLoadingAddress(true);
    try {
      const address = await reverseGeocode(lat, lng);
      setFormData(prev => ({
        ...prev,
        address: address,
      }));
      setSearchAddress(address);
    } catch (error) {
      logger.error('Error getting address:', error);
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (branch) {
        // Edit mode - mevcut verileri doldur
        const location = branch.location 
          ? { latitude: branch.location.latitude, longitude: branch.location.longitude }
          : null;
        
        setFormData({
          name: branch.name || '',
          desc: branch.desc || '',
          location: location,
          address: branch.address || '',
          phone: branch.phone || '',
          email: branch.email || '',
          workingHours: branch.workingHours || {
            weekday: '',
            saturday: '',
            sunday: '',
          },
          isActive: branch.isActive !== undefined ? branch.isActive : true,
        });
        
        // Harita merkezini ayarla
        if (location) {
          setMapCenter({ lat: location.latitude, lng: location.longitude });
          setSelectedLocation({ lat: location.latitude, lng: location.longitude });
          setSearchAddress(branch.address || '');
        } else {
          setMapCenter(defaultCenter);
          setSelectedLocation(null);
          setSearchAddress('');
        }
      } else {
        // Create mode - formu temizle
        setFormData({
          name: '',
          desc: '',
          location: null,
          address: '',
          phone: '',
          email: '',
          workingHours: {
            weekday: '',
            saturday: '',
            sunday: '',
          },
          isActive: true,
        });
        setMapCenter(defaultCenter);
        setSelectedLocation(null);
        setSearchAddress('');
      }
      setError(null);
    }
  }, [isOpen, branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Şube adı zorunludur');
      return;
    }

    if (!formData.location) {
      setError('Lütfen haritadan konum seçin');
      return;
    }

    try {
      setLoading(true);

      const body: any = {
        name: formData.name.trim(),
        location: formData.location,
      };

      if (formData.desc.trim()) body.desc = formData.desc.trim();
      if (formData.address.trim()) body.address = formData.address.trim();
      if (formData.phone.trim()) body.phone = formData.phone.trim();
      if (formData.email.trim()) body.email = formData.email.trim();

      // Çalışma saatlerini ekle (en az bir tanesi doluysa)
      const workingHours: any = {};
      if (formData.workingHours.weekday.trim()) workingHours.weekday = formData.workingHours.weekday.trim();
      if (formData.workingHours.saturday.trim()) workingHours.saturday = formData.workingHours.saturday.trim();
      if (formData.workingHours.sunday.trim()) workingHours.sunday = formData.workingHours.sunday.trim();
      if (Object.keys(workingHours).length > 0) body.workingHours = workingHours;

      if (isEditMode) body.isActive = formData.isActive;

      if (isEditMode) {
        const response = await apiRequest<{ branch: Branch }>(`/api/branches/${branch!.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        onSuccess(response.branch);
      } else {
        const response = await apiRequest<{ branch: Branch }>('/api/branches', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        onSuccess(response.branch);
      }

      onClose();
    } catch (err: any) {
      logger.error('Error saving branch:', err);
      setError(err.message || 'Şube kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">
              {isEditMode ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Şube Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Örn: Kadıköy Şubesi"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Şube hakkında açıklama"
                />
              </div>

              {/* Harita ile Konum Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konum Seçimi <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Adres arayın veya haritaya tıklayın)</span>
                </label>
                
                {!googleMapsApiKey ? (
                  <div className="w-full h-[400px] border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500">Google Maps API key yapılandırılmamış</p>
                  </div>
                ) : loadError ? (
                  <div className="w-full h-[400px] border border-red-300 rounded-lg flex items-center justify-center bg-red-50">
                    <p className="text-red-600">Google Maps yüklenirken hata oluştu</p>
                  </div>
                ) : !isLoaded ? (
                  <div className="w-full h-[400px] border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-500">Harita yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Adres Arama */}
                    <div className="mb-3">
                      <Autocomplete
                        onLoad={(autocomplete) => {
                          autocompleteRef.current = autocomplete;
                        }}
                        onPlaceChanged={() => {
                          const place = autocompleteRef.current?.getPlace();
                          if (place?.geometry?.location) {
                            const lat = place.geometry.location.lat();
                            const lng = place.geometry.location.lng();
                            
                            setSelectedLocation({ lat, lng });
                            setMapCenter({ lat, lng });
                            setFormData(prev => ({
                              ...prev,
                              location: { latitude: lat, longitude: lng },
                              address: place.formatted_address || prev.address,
                            }));
                            setSearchAddress(place.formatted_address || '');
                          }
                        }}
                        options={{
                          componentRestrictions: { country: 'tr' }, // Türkiye'ye sınırla
                          fields: ['geometry', 'formatted_address'],
                        }}
                      >
                        <input
                          type="text"
                          value={searchAddress}
                          onChange={(e) => setSearchAddress(e.target.value)}
                          placeholder="Örn: Kadıköy, İstanbul veya tam adres..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </Autocomplete>
                    </div>
                    
                    {/* Harita */}
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={selectedLocation ? 15 : 10}
                      onClick={handleMapClick}
                      onLoad={(map) => {
                        mapRef.current = map;
                      }}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                      }}
                    >
                      {selectedLocation && (
                        <Marker
                          position={selectedLocation}
                          icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                          }}
                        />
                      )}
                    </GoogleMap>
                  </>
                )}
                
                {loadingAddress && (
                  <p className="mt-2 text-sm text-gray-500">Adres alınıyor...</p>
                )}
              </div>

              {/* Seçilen Adres (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Seçilen Konumun Adresi
                </label>
                <textarea
                  value={formData.address}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  rows={2}
                  placeholder="Haritadan konum seçin, adres otomatik olarak doldurulacak"
                />
                {formData.location && (
                  <p className="mt-1 text-xs text-gray-500">
                    Koordinat: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Telefon ve E-posta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon (Sabit Hat)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: 0216 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: kadikoy@sendika.com"
                  />
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Çalışma Saatleri
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hafta İçi
                    </label>
                    <input
                      type="text"
                      value={formData.workingHours.weekday}
                      onChange={(e) => setFormData({
                        ...formData,
                        workingHours: { ...formData.workingHours, weekday: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Örn: 09:00 - 18:00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cumartesi
                    </label>
                    <input
                      type="text"
                      value={formData.workingHours.saturday}
                      onChange={(e) => setFormData({
                        ...formData,
                        workingHours: { ...formData.workingHours, saturday: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Örn: 09:00 - 13:00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Pazar
                    </label>
                    <input
                      type="text"
                      value={formData.workingHours.sunday}
                      onChange={(e) => setFormData({
                        ...formData,
                        workingHours: { ...formData.workingHours, sunday: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Örn: Kapalı"
                    />
                  </div>
                </div>
              </div>

              {/* Aktiflik (sadece düzenleme modunda) */}
              {isEditMode && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-slate-700 border-gray-300 rounded focus:ring-slate-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !formData.location}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (isEditMode ? 'Güncelleniyor...' : 'Kaydediliyor...') : (isEditMode ? 'Güncelle' : 'Kaydet')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
