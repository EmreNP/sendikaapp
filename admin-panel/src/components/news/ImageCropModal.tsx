import { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { logger } from '@/utils/logger';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  imageFile: File;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number; // 3:4 = 0.75
}

export default function ImageCropModal({
  imageFile,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9, // 16:9 aspect ratio
}: ImageCropModalProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  useEffect(() => {
    if (imgSrc && imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio,
          naturalWidth,
          naturalHeight
        ),
        naturalWidth,
        naturalHeight
      );
      setCrop(crop);
    }
  }, [imgSrc, aspectRatio]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspectRatio,
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    );
    setCrop(crop);
  };

  const getCroppedImg = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const crop = completedCrop;

      if (!image || !canvas || !crop) {
        reject(new Error('Crop data is missing'));
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context is missing'));
        return;
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      const rotateRads = (rotate * Math.PI) / 180;
      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      // Move canvas origin to center of image
      ctx.translate(-cropX + centerX, -cropY + centerY);
      // Rotate around center
      ctx.rotate(rotateRads);
      // Scale
      ctx.scale(scale, scale);
      // Move back
      ctx.translate(-centerX, -centerY);

      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight
      );

      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop) {
      return;
    }

    try {
      setProcessing(true);
      const croppedBlob = await getCroppedImg();
      onCropComplete(croppedBlob);
      onClose();
    } catch (error) {
      logger.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imgSrc) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">Görseli Kırp (16:9 Oran)</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Kontroller */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yakınlaştırma: {Math.round(scale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Döndür: {rotate}°
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRotate((prev) => (prev - 90) % 360)}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Sola döndür"
                    >
                      <RotateCw className="w-4 h-4 text-gray-600 rotate-180" />
                    </button>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotate}
                      onChange={(e) => setRotate(Number(e.target.value))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setRotate((prev) => (prev + 90) % 360)}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Sağa döndür"
                    >
                      <RotateCw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Crop Area */}
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspectRatio}
                  minWidth={100}
                  minHeight={100}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxWidth: '100%',
                      maxHeight: '70vh',
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              {/* Hidden canvas for processing */}
              <canvas
                ref={canvasRef}
                style={{
                  display: 'none',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={processing}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleCropComplete}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!completedCrop || processing}
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Onayla
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

