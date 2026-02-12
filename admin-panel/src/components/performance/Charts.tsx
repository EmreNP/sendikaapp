import { useMemo } from 'react';

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartItem[];
  height?: number;
  showValues?: boolean;
  className?: string;
}

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
];

export default function SimpleBarChart({
  data,
  height = 200,
  showValues = true,
  className = '',
}: SimpleBarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  
  // Dinamik bar genişliği - az veri varsa daha geniş, çok veri varsa daha dar
  const barSpacing = data.length <= 7 ? 'gap-3' : data.length <= 14 ? 'gap-2' : 'gap-1.5';
  const labelSize = data.length <= 7 ? 'text-[11px]' : data.length <= 14 ? 'text-[10px]' : 'text-[9px]';

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-400 text-sm">Veri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`flex items-end ${barSpacing}`} style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const colorClass = item.color || COLORS[index % COLORS.length];

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex-1 flex flex-col items-center gap-1 min-w-0"
            >
              {showValues && item.value > 0 && (
                <span className="text-xs font-semibold text-gray-700">{item.value}</span>
              )}
              <div className="w-full flex items-end" style={{ height: `${height - 30}px` }}>
                <div
                  className={`w-full ${colorClass} rounded-t-md transition-all duration-700 ease-out hover:opacity-80 cursor-pointer`}
                  style={{ height: `${Math.max(barHeight, 2)}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className={`flex ${barSpacing} mt-2`}>
        {data.map((item, index) => (
          <div
            key={`label-${item.label}-${index}`}
            className={`flex-1 text-center ${labelSize} text-gray-500 truncate min-w-0 font-medium`}
            title={item.label}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Donut / Ring Chart ====================
interface DonutChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  className?: string;
}

export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 10,
  color,
  bgColor = '#e5e7eb',
  label,
  className = '',
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  // Renk skoru değerine göre otomatik
  const autoColor =
    value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';
  const strokeColor = color || autoColor;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Value arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{value}</span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
    </div>
  );
}

// ==================== Mini Sparkline ====================
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color = '#3b82f6',
  className = '',
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        points={areaPoints}
        fill={`${color}15`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ==================== Progress Bar ====================
interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  color = 'bg-blue-500',
  className = '',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-semibold text-gray-800">
            {value} / {max}
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
