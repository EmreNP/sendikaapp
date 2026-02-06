// Theme Constants - Renk paleti ve stil sabitleri

export const COLORS = {
  // Primary
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  primaryLight: '#3b82f6',
  
  // Secondary
  secondary: '#64748b',
  secondaryDark: '#475569',
  secondaryLight: '#94a3b8',
  
  // Background
  background: '#f8fafc',
  backgroundDark: '#f1f5f9',
  surface: '#ffffff',
  
  // Text
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  textWhite: '#ffffff',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Gradient
  gradientStart: '#1e40af',
  gradientEnd: '#1e3a8a',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
