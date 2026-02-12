import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

// ==================== Stat Card ====================
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.value > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : trend.value < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span
                className={`text-xs font-semibold ${
                  trend.value > 0
                    ? 'text-emerald-600'
                    : trend.value < 0
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-400 ml-0.5">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Card Wrapper ====================
interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ title, subtitle, action, children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'px-5 pb-5'}>{children}</div>
    </div>
  );
}

// ==================== Empty State ====================
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-300" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      {description && <p className="mt-1 text-xs text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ==================== Badge ====================
interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const badgeVariants = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  danger: 'bg-red-50 text-red-700 ring-red-600/10',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  neutral: 'bg-gray-50 text-gray-700 ring-gray-600/10',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ==================== Skeleton Loading ====================
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm animate-pulse ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-2.5 bg-gray-100 rounded w-20" />
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 bg-gray-100 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-50 rounded" />
      ))}
    </div>
  );
}
