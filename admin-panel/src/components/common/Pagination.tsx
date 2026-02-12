import React from 'react';

interface PaginationProps {
  /** Mevcut sayfa numarası (1-based) */
  currentPage: number;
  /** Toplam kayıt sayısı */
  total: number;
  /** Sayfa başına kayıt sayısı */
  limit: number;
  /** Sayfa değiştiğinde çağrılır */
  onPageChange: (page: number) => void;
  /** "Toplam X kayıt" yerine özel metin (opsiyonel) */
  totalLabel?: string;
  /** Bilgi satırını gizle */
  hideInfo?: boolean;
  /** Sayfa numaralı butonları göster (true ise UsersPage tarzı, false ise basit önceki/sonraki) */
  showPageNumbers?: boolean;
}

/**
 * Ortak Pagination bileşeni
 * Tüm liste sayfalarında kullanılır (FAQ, Haberler, Kullanıcılar, Aktiviteler, vb.)
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  total,
  limit,
  onPageChange,
  totalLabel,
  hideInfo = false,
  showPageNumbers = true,
}) => {
  const totalPages = Math.ceil(total / limit);
  
  // Tek sayfa veya veri yoksa gösterme
  if (totalPages <= 1 && total <= limit) {
    // Sadece bilgi satırını göster (kayıt varsa)
    if (total > 0 && !hideInfo) {
      return (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {totalLabel || `Toplam ${total} kayıt`}
          </div>
        </div>
      );
    }
    return null;
  }

  const startItem = ((currentPage - 1) * limit) + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Bilgi satırı */}
      {!hideInfo && (
        <div className="text-sm text-gray-500">
          {totalLabel || `Toplam ${total} kayıttan ${startItem}-${endItem} arası gösteriliyor`}
        </div>
      )}

      {/* Pagination kontrolleri */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* Önceki butonu */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Önceki
          </button>

          {showPageNumbers ? (
            <div className="flex items-center gap-1">
              {/* İlk sayfa */}
              {currentPage > 3 && (
                <>
                  <PageButton page={1} currentPage={currentPage} onClick={onPageChange} />
                  {currentPage > 4 && <Ellipsis />}
                </>
              )}

              {/* Ortadaki sayfalar */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;
                if (currentPage > 3 && pageNum === 1) return null;
                if (currentPage < totalPages - 2 && pageNum === totalPages) return null;

                return (
                  <PageButton
                    key={pageNum}
                    page={pageNum}
                    currentPage={currentPage}
                    onClick={onPageChange}
                  />
                );
              })}

              {/* Son sayfa */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <Ellipsis />}
                  <PageButton page={totalPages} currentPage={currentPage} onClick={onPageChange} />
                </>
              )}
            </div>
          ) : (
            <span className="px-4 py-2 text-sm text-gray-700">
              Sayfa {currentPage} / {totalPages}
            </span>
          )}

          {/* Sonraki butonu */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};

/** Sayfa numarası butonu */
const PageButton: React.FC<{
  page: number;
  currentPage: number;
  onClick: (page: number) => void;
}> = ({ page, currentPage, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
      currentPage === page
        ? 'bg-slate-700 text-white'
        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
    }`}
  >
    {page}
  </button>
);

/** Sayfa numarası arasındaki üç nokta */
const Ellipsis: React.FC = () => (
  <span className="px-2 text-gray-500">...</span>
);

export default Pagination;
