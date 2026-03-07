/**
 * PdfFormEditor
 *
 * PDF sayfalarını canvas üzerine render eder ve her form alanının
 * üzerine şeffaf bir React input overlay eder. Kullanıcı bu inputlarla
 * değişiklik yaptığında değerler React state'inde tutulur; onFieldValuesChange
 * callback'i ile dışarıya iletilir. İndirme sırasında bu değerler pdf-lib'e
 * verilerek güncel PDF oluşturulur.
 *
 * Neden iframe değil?
 * Tarayıcının native PDF viewer'ı bir sandbox plugin içinde çalışır;
 * kullanıcının yaptığı değişiklikler JavaScript tarafından okunamaz.
 */
import { useEffect, useRef, useState, useCallback, type Ref } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { X, ImageIcon } from 'lucide-react';
import { logger } from '@/utils/logger';

// Vite tarafından hash'li URL'e çevriliyor, bu sayede CSP 'self' ile uyumlu
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Standard font verileri (ZapfDingbats, Symbol vb.) için CDN — checkbox render uyarısını giderir
const STANDARD_FONT_DATA_URL = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`;

const SCALE = 1.5;

// PDF spec bit 24 (0-indexed) = Comb flag = decimal 16777216
const FF_COMB = 1 << 24;

// ──────────────────────────────────────────────
// Tipler
// ──────────────────────────────────────────────
interface OverlayField {
  id: string;
  fieldName: string;
  /** true → native checkbox input */
  isCheckbox: boolean;
  /** true → comb (kutucuk) text field */
  isComb: boolean;
  /** Comb kutucuk sayısı (maxLen'den) */
  combLen: number;
  /** true → PDF imza alanı (fieldType === 'Sig') */
  isSignature: boolean;
  /** Viewport (piksel) koordinatları */
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PageInfo {
  pageProxy: PDFPageProxy;
  canvasWidth: number;
  canvasHeight: number;
  overlays: OverlayField[];
}

export interface PdfFormEditorProps {
  pdfUrl: string;
  /** Her alan değişikliğinde bütün güncel field map'ini döner */
  onFieldValuesChange: (values: Record<string, string | boolean>) => void;
  contentRef?: Ref<HTMLDivElement>;
  /**
   * İmza alanları için varsayılan değerler.
   * Örnek: { basknsignature: 'data:image/png;base64,...' }
   * PDF yüklenince bu değerler otomatik uygulanır.
   */
  defaultSignatures?: Record<string, string>;
}

// İmza alanı adları (PDF field name → Türkçe etiket)
const SIGNATURE_LABELS: Record<string, string> = {
  kamugorevlisisign: 'Kamu Görevlisi İmzası',
  basknsignature: 'Başkan İmzası',
};

// ──────────────────────────────────────────────
// İmza çizim pedi (modal)
// ──────────────────────────────────────────────
export function SignaturePad({
  fieldLabel,
  initialValue,
  onSave,
  onClose,
}: {
  fieldLabel: string;
  initialValue?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);

  // ── Crop state ──
  const [cropSource, setCropSource] = useState<{ dataUrl: string; w: number; h: number } | null>(null);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropDragRef = useRef<{
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se';
    startX: number; startY: number;
    initRect: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const CROP_W = 460;
  const CROP_H = 300;
  const HANDLE = 8;
  const MIN_CROP = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Mevcut imza varsa canvas'a yükle
    if (initialValue && initialValue.startsWith('data:')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawing(true);
      };
      img.src = initialValue;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Kırpma önizlemesini canvas'a çiz
  useEffect(() => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    if (!canvas || !img || !cropSource) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y, w, h } = cropRect;
    // Arka plan (tam resim)
    ctx.clearRect(0, 0, CROP_W, CROP_H);
    ctx.drawImage(img, 0, 0, CROP_W, CROP_H);
    // Karartma overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CROP_W, CROP_H);
    // Seçili kırpma bölgesini parlak göster
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, 0, 0, CROP_W, CROP_H);
    ctx.restore();
    // Sınır çizgisi
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    // Üçte-bir kılavuz çizgileri
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 3, y);         ctx.lineTo(x + w / 3, y + h);
    ctx.moveTo(x + (w * 2) / 3, y);   ctx.lineTo(x + (w * 2) / 3, y + h);
    ctx.moveTo(x, y + h / 3);         ctx.lineTo(x + w, y + h / 3);
    ctx.moveTo(x, y + (h * 2) / 3);   ctx.lineTo(x + w, y + (h * 2) / 3);
    ctx.stroke();
    // Köşe tutamaçları
    ([[x, y], [x + w, y], [x, y + h], [x + w, y + h]] as [number, number][]).forEach(([cx, cy]) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.fillRect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
      ctx.strokeRect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
    });
  }, [cropRect, cropSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawing(true);
    e.preventDefault();
  };

  const stopDraw = () => { isDrawingRef.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    setHasCleared(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        cropImgRef.current = img;
        const pad = 10;
        setCropRect({ x: pad, y: pad, w: CROP_W - pad * 2, h: CROP_H - pad * 2 });
        setCropSource({ dataUrl: src, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const getCropPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CROP_W / rect.width),
      y: (e.clientY - rect.top) * (CROP_H / rect.height),
    };
  };

  const getCropHit = (px: number, py: number, r: { x: number; y: number; w: number; h: number }) => {
    const t = HANDLE + 4;
    if (Math.abs(px - r.x) <= t && Math.abs(py - r.y) <= t) return 'nw';
    if (Math.abs(px - (r.x + r.w)) <= t && Math.abs(py - r.y) <= t) return 'ne';
    if (Math.abs(px - r.x) <= t && Math.abs(py - (r.y + r.h)) <= t) return 'sw';
    if (Math.abs(px - (r.x + r.w)) <= t && Math.abs(py - (r.y + r.h)) <= t) return 'se';
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return 'move';
    return null;
  };

  const onCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCropPos(e);
    const mode = getCropHit(pos.x, pos.y, cropRect);
    if (!mode) return;
    cropDragRef.current = { mode: mode as 'move' | 'nw' | 'ne' | 'sw' | 'se', startX: pos.x, startY: pos.y, initRect: { ...cropRect } };
    e.preventDefault();
  };

  const onCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropDragRef.current) return;
    const pos = getCropPos(e);
    const { mode, startX, startY, initRect } = cropDragRef.current;
    const dx = pos.x - startX;
    const dy = pos.y - startY;
    let { x, y, w, h } = initRect;
    if (mode === 'move') {
      x = Math.max(0, Math.min(CROP_W - w, x + dx));
      y = Math.max(0, Math.min(CROP_H - h, y + dy));
    } else if (mode === 'se') {
      w = Math.max(MIN_CROP, Math.min(CROP_W - x, w + dx));
      h = Math.max(MIN_CROP, Math.min(CROP_H - y, h + dy));
    } else if (mode === 'sw') {
      const nx = Math.max(0, Math.min(x + w - MIN_CROP, x + dx));
      w = x + w - nx; x = nx;
      h = Math.max(MIN_CROP, Math.min(CROP_H - y, h + dy));
    } else if (mode === 'ne') {
      w = Math.max(MIN_CROP, Math.min(CROP_W - x, w + dx));
      const ny = Math.max(0, Math.min(y + h - MIN_CROP, y + dy));
      h = y + h - ny; y = ny;
    } else if (mode === 'nw') {
      const nx = Math.max(0, Math.min(x + w - MIN_CROP, x + dx));
      w = x + w - nx; x = nx;
      const ny = Math.max(0, Math.min(y + h - MIN_CROP, y + dy));
      h = y + h - ny; y = ny;
    }
    setCropRect({ x, y, w, h });
    e.preventDefault();
  };

  const onCropMouseUp = () => { cropDragRef.current = null; };

  const applyCrop = () => {
    const img = cropImgRef.current;
    const canvas = canvasRef.current;
    const src = cropSource;
    if (!img || !canvas || !src) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scaleX = src.w / CROP_W;
    const scaleY = src.h / CROP_H;
    const srcX = cropRect.x * scaleX;
    const srcY = cropRect.y * scaleY;
    const srcW = cropRect.w * scaleX;
    const srcH = cropRect.h * scaleY;
    const PAD = 8;
    const maxW = canvas.width - PAD * 2;
    const maxH = canvas.height - PAD * 2;
    const fitScale = Math.min(maxW / srcW, maxH / srcH);
    const dw = srcW * fitScale;
    const dh = srcH * fitScale;
    const dx = PAD + (maxW - dw) / 2;
    const dy = PAD + (maxH - dh) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
    setHasDrawing(true);
    setCropSource(null);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasDrawing && !hasCleared) return; // hicbir şey yapılmadı
    onSave(hasDrawing ? canvas.toDataURL('image/png') : ''); // boş string = imzayı sil
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">İmza: {fieldLabel}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Fareyle veya parmağınızla imza çizin ya da resim yükleyin.</p>
          <canvas
            ref={canvasRef}
            width={460}
            height={160}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            style={{
              border: '1.5px solid #d1d5db',
              borderRadius: 8,
              cursor: 'crosshair',
              background: '#f9fafb',
              touchAction: 'none',
              width: '100%',
            }}
          />
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <span className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                <ImageIcon className="w-4 h-4" />
                Resim Yükle
              </span>
            </label>
            <button
              onClick={clearCanvas}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Temizle
            </button>
            <button
              onClick={save}
              disabled={!hasDrawing && !hasCleared}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* ── Kırpma Modal'ı ── */}
      {cropSource && (
        <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Kırpma Alanı Seç</h3>
              <button onClick={() => setCropSource(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Köşe tutamaçlarını sürükleyerek kırpma alanını belirleyin. Ortaya tıklayarak taşıyabilirsiniz.
            </p>
            <canvas
              ref={cropCanvasRef}
              width={CROP_W}
              height={CROP_H}
              onMouseDown={onCropMouseDown}
              onMouseMove={onCropMouseMove}
              onMouseUp={onCropMouseUp}
              onMouseLeave={onCropMouseUp}
              style={{
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                width: '100%',
                cursor: 'crosshair',
                touchAction: 'none',
                display: 'block',
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCropSource(null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={applyCrop}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Kırp ve Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// Comb (kutucuk) input bileşeni
// ──────────────────────────────────────────────
function CombInput({
  field,
  value,
  onChange,
}: {
  field: OverlayField;
  value: string;
  onChange: (name: string, val: string) => void;
}) {
  const boxWidth = field.width / field.combLen;
  const fontSize = Math.max(7, Math.min(field.height * 0.62, 13));

  return (
    <div
      style={{
        position: 'absolute',
        left: field.left,
        top: field.top,
        width: field.width,
        height: field.height,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {Array.from({ length: field.combLen }).map((_, i) => {
        const char = value[i] ?? '';
        return (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={char}
            onChange={(e) => {
              const raw = e.target.value.slice(-1);
              const arr = value.split('');
              arr[i] = raw;
              onChange(field.fieldName, arr.slice(0, field.combLen).join(''));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && char === '' && i > 0) {
                const prev = e.currentTarget.parentElement?.children[i - 1] as HTMLInputElement | null;
                prev?.focus();
              }
            }}
            onInput={(e) => {
              if ((e.currentTarget as HTMLInputElement).value) {
                const next = e.currentTarget.parentElement?.children[i + 1] as HTMLInputElement | null;
                next?.focus();
              }
            }}
            style={{
              width: boxWidth,
              height: field.height,
              background: 'rgba(255,255,255,0.92)',
              border: 'none',
              borderRight: i < field.combLen - 1 ? '1px solid rgba(59,130,246,0.35)' : 'none',
              borderTop: '1.5px solid rgba(59,130,246,0.45)',
              borderBottom: '1.5px solid rgba(59,130,246,0.45)',
              borderLeft: i === 0 ? '1.5px solid rgba(59,130,246,0.45)' : 'none',
              fontSize: `${fontSize}px`,
              textAlign: 'center',
              padding: 0,
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#111',
              flexShrink: 0,
            }}
            onFocus={(e) => { e.currentTarget.style.background = 'rgba(219,234,254,0.95)'; }}
            onBlur={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Alt bileşen: tek sayfa
// ──────────────────────────────────────────────
function PdfPage({
  info,
  fieldValues,
  onFieldChange,
  onSignatureClick,
}: {
  info: PageInfo;
  fieldValues: Record<string, string | boolean>;
  onFieldChange: (name: string, value: string | boolean) => void;
  onSignatureClick: (fieldName: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Önceki render hâlâ devam ediyorsa iptal et
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const viewport = info.pageProxy.getViewport({ scale: SCALE });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const task = info.pageProxy.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    task.promise.then(
      () => { renderTaskRef.current = null; },
      () => { /* iptal veya hata — sessizce geç */ }
    );

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [info.pageProxy]);

  return (
    <div
      data-pdf-editor-page="true"
      className="relative shadow-lg bg-white"
      style={{ width: info.canvasWidth, height: info.canvasHeight, flexShrink: 0 }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {info.overlays.map((field) => {
        const value = fieldValues[field.fieldName];

        // ── Checkbox ──────────────────────────────────────────────────────
        if (field.isCheckbox) {
          return (
            <input
              key={field.id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onFieldChange(field.fieldName, e.target.checked)}
              style={{
                position: 'absolute',
                left: field.left,
                top: field.top,
                width: field.width,
                height: field.height,
                cursor: 'pointer',
                accentColor: '#1d4ed8',
                margin: 0,
                opacity: 0.85,
              }}
            />
          );
        }

        // ── Signature field ───────────────────────────────────────────────
        if (field.isSignature) {
          const sigImg = typeof value === 'string' && value.startsWith('data:') ? value : null;
          return (
            <div
              key={field.id}
              onClick={() => onSignatureClick(field.fieldName)}
              title="Tıkla → imza ekle / değiştir"
              style={{
                position: 'absolute',
                left: field.left,
                top: field.top,
                width: field.width,
                height: field.height,
                cursor: 'pointer',
                border: '1.5px dashed rgba(59,130,246,0.55)',
                borderRadius: 3,
                background: 'rgba(239,246,255,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {sigImg ? (
                <img src={sigImg} alt="İmza" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 10, color: 'rgba(59,130,246,0.7)', pointerEvents: 'none', userSelect: 'none' }}>
                  ✍ İmza
                </span>
              )}
            </div>
          );
        }

        // ── Comb (box-box) field ──────────────────────────────────────────
        if (field.isComb && field.combLen > 0) {
          return (
            <CombInput
              key={field.id}
              field={field}
              value={typeof value === 'string' ? value : ''}
              onChange={onFieldChange}
            />
          );
        }

        // ── Normal text field ─────────────────────────────────────────────
        return (
          <input
            key={field.id}
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onFieldChange(field.fieldName, e.target.value)}
            style={{
              position: 'absolute',
              left: field.left,
              top: field.top,
              width: field.width,
              height: field.height,
              background: 'rgba(255, 255, 255, 0.92)',
              border: '1.5px solid rgba(59, 130, 246, 0.45)',
              borderRadius: 2,
              fontSize: `${Math.max(7, Math.min(field.height * 0.62, 13))}px`,
              padding: '0 3px',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#111',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(219, 234, 254, 0.95)';
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.9)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.92)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)';
            }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Ana bileşen
// ──────────────────────────────────────────────
export function PdfFormEditor({ pdfUrl, onFieldValuesChange, contentRef, defaultSignatures }: PdfFormEditorProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureTarget, setSignatureTarget] = useState<string | null>(null);

  // Stale closure'ı önlemek için her render'da güncel tutulur
  const defaultSignaturesRef = useRef(defaultSignatures);
  useEffect(() => { defaultSignaturesRef.current = defaultSignatures; });

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          standardFontDataUrl: STANDARD_FONT_DATA_URL,
        });
        const doc = await loadingTask.promise;
        if (cancelled) return;

        const pagesData: PageInfo[] = [];
        const initValues: Record<string, string | boolean> = {};

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: SCALE });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawAnnotations: any[] = await page.getAnnotations();
          if (cancelled) return;

          const overlays: OverlayField[] = [];

          for (let i = 0; i < rawAnnotations.length; i++) {
            const ann = rawAnnotations[i];
            if (ann.subtype !== 'Widget' || !ann.fieldName) continue;

            // PDF (bottom-left) → viewport (top-left) koordinat dönüşümü
            const vpRect = viewport.convertToViewportRectangle(ann.rect);
            const left = Math.min(vpRect[0], vpRect[2]);
            const top = Math.min(vpRect[1], vpRect[3]);
            const width = Math.abs(vpRect[2] - vpRect[0]);
            const height = Math.abs(vpRect[3] - vpRect[1]);

            // PDF.js annotation data'sında checkBox property'si boolean olarak gelir
            const isSignature: boolean = ann.fieldType === 'Sig';
            const isCheckbox: boolean =
              !isSignature && (
                ann.checkBox === true ||
                (ann.fieldType === 'Btn' && ann.radioButton !== true && ann.checkBox !== false)
              );

            // Comb flag: PDF spec bit 24 = 16777216
            // PDF.js'te fieldFlags veya flags olarak gelebilir
            const fieldFlags: number = ann.fieldFlags ?? ann.flags ?? 0;
            const isComb: boolean = !isCheckbox && !isSignature && (fieldFlags & FF_COMB) !== 0;
            const combLen: number = isComb ? (ann.maxLen ?? 0) : 0;

            const fieldName: string = ann.fieldName;

            // İlk değeri sadece bir kez kaydet (birden fazla sayfada aynı alan olabilir)
            if (!(fieldName in initValues)) {
              if (isCheckbox) {
                const fv = ann.fieldValue;
                initValues[fieldName] =
                  fv !== 'Off' && fv !== null && fv !== undefined && fv !== '';
              } else {
                initValues[fieldName] =
                  typeof ann.fieldValue === 'string' ? ann.fieldValue : '';
              }
            }

            overlays.push({
              id: `p${pageNum}-${i}-${fieldName}`,
              fieldName,
              isCheckbox,
              isComb,
              combLen,
              isSignature,
              left,
              top,
              width,
              height,
            });
          }

          pagesData.push({
            pageProxy: page,
            canvasWidth: viewport.width,
            canvasHeight: viewport.height,
            overlays,
          });
        }

        if (!cancelled) {
          // Varsayılan imzaları en güncel değerle uygula (ref sayesinde stale closure yok)
          const latestSigs = defaultSignaturesRef.current;
          if (latestSigs) {
            for (const [k, v] of Object.entries(latestSigs)) {
              if (v) initValues[k] = v;
            }
          }
          const sigFieldNames = pagesData.flatMap(p => p.overlays).filter(o => o.isSignature).map(o => o.fieldName);
          const combCount = pagesData.flatMap(p => p.overlays).filter(o => o.isComb).length;
          const cbCount = pagesData.flatMap(p => p.overlays).filter(o => o.isCheckbox).length;
          const sigCount = sigFieldNames.length;
          logger.info('[PdfFormEditor] preview loaded', {
            pageCount: pagesData.length,
            overlayCount: pagesData.reduce((sum, p) => sum + p.overlays.length, 0),
            combFieldCount: combCount,
            checkboxCount: cbCount,
            signatureCount: sigCount,
            signatureFieldNames: sigFieldNames,
            defaultSigKeys: latestSigs ? Object.keys(latestSigs) : [],
            fieldCount: Object.keys(initValues).length,
          });
          setPages(pagesData);
          setFieldValues(initValues);
          onFieldValuesChange(initValues);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('[PdfFormEditor] preview load failed', err);
          setError(err instanceof Error ? err.message : 'PDF yüklenemedi');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // defaultSignatures prop'u geç (async) gelirse — örn. localStorage'dan yüklendikten sonra —
  // mevcut fieldValues'e fark olarak uygula ve parent'ı bilgilendir.
  useEffect(() => {
    if (!defaultSignatures || Object.keys(defaultSignatures).length === 0) return;
    setFieldValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(defaultSignatures)) {
        if (v && prev[k] !== v) { next[k] = v; changed = true; }
      }
      if (!changed) return prev;
      onFieldValuesChange(next);
      return next;
    });
  }, [defaultSignatures]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = useCallback(
    (name: string, value: string | boolean) => {
      setFieldValues((prev) => {
        const next = { ...prev, [name]: value };
        logger.debug('[PdfFormEditor] field changed', {
          fieldName: name,
          value,
          totalFieldCount: Object.keys(next).length,
        });
        onFieldValuesChange(next);
        return next;
      });
    },
    [onFieldValuesChange]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        <span className="text-gray-600 text-sm">PDF yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* PDF sayfaları */}
      <div className="flex-1 overflow-y-auto bg-gray-300 p-4">
        <div ref={contentRef} className="flex flex-col items-center gap-4 min-h-full">
          {pages.map((pageInfo, idx) => (
            <PdfPage
              key={idx}
              info={pageInfo}
              fieldValues={fieldValues}
              onFieldChange={handleFieldChange}
              onSignatureClick={setSignatureTarget}
            />
          ))}
        </div>
      </div>

      {/* İmza çizim modali */}
      {signatureTarget && (
        <SignaturePad
          fieldLabel={SIGNATURE_LABELS[signatureTarget] ?? signatureTarget}
          initialValue={typeof fieldValues[signatureTarget] === 'string' ? fieldValues[signatureTarget] as string : undefined}
          onSave={(dataUrl) => {
            handleFieldChange(signatureTarget, dataUrl);
            setSignatureTarget(null);
          }}
          onClose={() => setSignatureTarget(null)}
        />
      )}
    </div>
  );
}
