import { LucideIcon } from 'lucide-react';

export type ActionButtonVariant = 
  | 'edit'           // Düzenle
  | 'delete'         // Sil
  | 'preview'        // Önizle (sadece görüntüleme)
  | 'publish'        // Yayınla
  | 'unpublish'      // Yayından Kaldır
  | 'activate'       // Aktif Et
  | 'deactivate'     // Pasif Et
  | 'role'           // Rol Değiştir
  | 'status'         // Durum Değiştir
  | 'view'           // Detaylara Git
  | 'custom';        // Özel stil

interface ActionButtonProps {
  icon: LucideIcon;
  variant: ActionButtonVariant;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  className?: string;
}

export default function ActionButton({
  icon: Icon,
  variant,
  onClick,
  title,
  disabled = false,
  className = '',
}: ActionButtonProps) {
  // Variant'a göre stil sınıfları
  const getVariantStyles = () => {
    const baseStyles = 'p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (variant) {
      case 'edit':
        return `${baseStyles} text-slate-700 hover:bg-slate-50 hover:text-slate-900`;
      
      case 'delete':
        return `${baseStyles} text-red-600 hover:bg-red-50 hover:text-red-700`;
      
      case 'preview':
        // Önizle butonu - daha yumuşak mavi, sadece görüntüleme amaçlı
        return `${baseStyles} text-blue-500 hover:bg-blue-50 hover:text-blue-600`;
      
      case 'publish':
        return `${baseStyles} text-green-600 hover:bg-green-50 hover:text-green-700`;
      
      case 'unpublish':
        return `${baseStyles} text-orange-600 hover:bg-orange-50 hover:text-orange-700`;
      
      case 'activate':
        return `${baseStyles} text-green-600 hover:bg-green-50 hover:text-green-700`;
      
      case 'deactivate':
        return `${baseStyles} text-orange-600 hover:bg-orange-50 hover:text-orange-700`;
      
      case 'role':
        return `${baseStyles} text-blue-600 hover:bg-blue-50 hover:text-blue-700`;
      
      case 'status':
        return `${baseStyles} text-purple-600 hover:bg-purple-50 hover:text-purple-700`;
      
      case 'view':
        return `${baseStyles} text-blue-600 hover:bg-blue-50 hover:text-blue-700`;
      
      case 'custom':
        return baseStyles;
      
      default:
        return `${baseStyles} text-slate-700 hover:bg-slate-50`;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getVariantStyles()} ${className}`}
      title={title}
      type="button"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

