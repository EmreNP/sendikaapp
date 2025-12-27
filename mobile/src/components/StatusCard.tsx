import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import type { UserStatus } from '@shared/types/user';

interface StatusCardProps {
  status: UserStatus;
}

const STATUS_CONFIG: Record<UserStatus, { 
  label: string; 
  description: string; 
  color: string;
  icon: string;
}> = {
  pending_details: {
    label: 'Detay Bekleniyor',
    description: 'Lütfen kayıt detaylarınızı tamamlayın',
    color: COLORS.pending,
    icon: '⏳',
  },
  pending_branch_review: {
    label: 'Şube Onayı Bekleniyor',
    description: 'Başvurunuz şube yöneticiniz tarafından inceleniyor',
    color: COLORS.warning,
    icon: '👁️',
  },
  pending_admin_approval: {
    label: 'Yönetici Onayı Bekleniyor',
    description: 'Başvurunuz sistem yöneticisi tarafından inceleniyor',
    color: COLORS.info,
    icon: '🔍',
  },
  active: {
    label: 'Aktif Üye',
    description: 'Üyeliğiniz onaylandı ve aktif durumda',
    color: COLORS.success,
    icon: '✅',
  },
  rejected: {
    label: 'Reddedildi',
    description: 'Başvurunuz reddedildi',
    color: COLORS.error,
    icon: '❌',
  },
};

export const StatusCard: React.FC<StatusCardProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.label, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>
      <Text style={styles.description}>{config.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

