// All Announcements Screen - Redesigned to match front web design
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ApiService from '../services/api';
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

  const getPriorityColor = (priority?: string): [string, string] => {
    switch (priority) {
      case 'high':
        return ['#ef4444', '#dc2626'];
      case 'medium':
        return ['#f59e0b', '#d97706'];
      default:
        return ['#2563eb', '#1d4ed8'];
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

  const getPriorityIcon = (priority?: string): 'alert-triangle' | 'alert-circle' | 'bell' => {
    switch (priority) {
      case 'high':
        return 'alert-triangle';
      case 'medium':
        return 'alert-circle';
      default:
        return 'bell';
    }
  };

  const toggleAnnouncement = (id: string) => {
    setSelectedAnnouncement(selectedAnnouncement === id ? null : id);
  };

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => {
    const isExpanded = selectedAnnouncement === item.id;
    const priorityColors = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.announcementCard, isExpanded && styles.announcementCardExpanded]}
        onPress={() => toggleAnnouncement(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={priorityColors}
            style={styles.priorityIndicator}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={isExpanded ? undefined : 2}>
                {item.title}
              </Text>
              <Feather 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={18} 
                color="#94a3b8" 
              />
            </View>
            <View style={styles.cardMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[0] + '15' }]}>
                <Feather name={getPriorityIcon(item.priority)} size={12} color={priorityColors[0]} style={{ marginRight: 4 }} />
                <Text style={[styles.priorityText, { color: priorityColors[0] }]}>
                  {getPriorityLabel(item.priority)}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <Feather name="calendar" size={12} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.cardDate}>{formatDate(item.createdAt || '')}</Text>
              </View>
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
        <LinearGradient
          colors={['#4f46e5', '#4338ca']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Duyurular</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#4f46e5', '#4338ca']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyurular</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <FlatList
        data={announcements}
        renderItem={renderAnnouncementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />
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
            <View style={styles.emptyIconContainer}>
              <Feather name="bell" size={48} color="#4338ca" />
            </View>
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
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementCardExpanded: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  priorityIndicator: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 12,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
    backgroundColor: '#fafafa',
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
