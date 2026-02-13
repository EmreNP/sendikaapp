// Notification Storage Service - Local notification read state management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const READ_NOTIFICATIONS_KEY = '@sendika_read_notifications';
const UNREAD_COUNT_KEY = '@sendika_unread_count';

/**
 * Get the set of read notification IDs
 */
export async function getReadNotificationIds(): Promise<Set<string>> {
  try {
    const stored = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    logger.warn('Failed to load read notifications:', error);
  }
  return new Set();
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const readIds = await getReadNotificationIds();
    readIds.add(notificationId);
    await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readIds]));
  } catch (error) {
    logger.warn('Failed to mark notification as read:', error);
  }
}

/**
 * Mark multiple notifications as read
 */
export async function markAllNotificationsAsRead(notificationIds: string[]): Promise<void> {
  try {
    const readIds = await getReadNotificationIds();
    notificationIds.forEach(id => readIds.add(id));
    await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readIds]));
  } catch (error) {
    logger.warn('Failed to mark notifications as read:', error);
  }
}

/**
 * Store the unread count for badge display
 */
export async function setUnreadCount(count: number): Promise<void> {
  try {
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, String(count));
  } catch (error) {
    logger.warn('Failed to save unread count:', error);
  }
}

/**
 * Get cached unread count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Cleanup old read notification IDs to prevent storage bloat
 * Keeps only the most recent 500 IDs
 */
export async function cleanupReadNotifications(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      if (ids.length > 500) {
        const trimmed = ids.slice(-500);
        await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(trimmed));
      }
    }
  } catch (error) {
    logger.warn('Failed to cleanup read notifications:', error);
  }
}

/**
 * Clear all notification state (for logout)
 */
export async function clearNotificationState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([READ_NOTIFICATIONS_KEY, UNREAD_COUNT_KEY]);
  } catch (error) {
    logger.warn('Failed to clear notification state:', error);
  }
}
