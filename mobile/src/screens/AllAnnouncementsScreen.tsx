// All Announcements Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW } from '../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Announcement } from '../types';

type AllAnnouncementsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AllAnnouncements'>;
};

export const AllAnnouncementsScreen: React.FC<AllAnnouncementsScreenProps> = ({
  navigation,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await ApiService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'Önemli';
      case 'medium':
        return 'Orta';
      default:
        return 'Normal';
    }
  };

  const toggleAnnouncement = (id: string) => {
    setSelectedAnnouncement(selectedAnnouncement === id ? null : id);
  };

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => {
    const isExpanded = selectedAnnouncement === item.id;
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.announcementCard, isExpanded && styles.announcementCardExpanded]}
        onPress={() => toggleAnnouncement(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={isExpanded ? undefined : 2}>
                {item.title}
              </Text>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
            <View style={styles.cardMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {getPriorityLabel(item.priority)}
                </Text>
              </View>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>

        {isExpanded && item.content && (
          <View style={styles.expandedContent}>
            <Text style={styles.contentText}>{item.content}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Duyurular</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyurular</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={announcements}
        renderItem={renderAnnouncementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListHeaderComponent={
          announcements.length > 0 ? (
            <Text style={styles.listHeader}>
              {announcements.length} duyuru mevcut
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📢</Text>
            <Text style={styles.emptyTitle}>Henüz Duyuru Yok</Text>
            <Text style={styles.emptyText}>
              Yeni duyurular eklendiğinde burada görünecektir.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
  listHeader: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  announcementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  announcementCardExpanded: {
    ...SHADOW.md,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  priorityIndicator: {
    width: 4,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  priorityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  contentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
