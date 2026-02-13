// Notification Badge Context - Global unread count state
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { getUnreadCount, getReadNotificationIds, setUnreadCount as saveUnreadCount } from '../services/notificationStorage';
import ApiService from '../services/api';

interface NotificationBadgeContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  clearBadge: () => void;
}

const NotificationBadgeContext = createContext<NotificationBadgeContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  clearBadge: () => {},
});

export const NotificationBadgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await ApiService.getNotifications({ page: 1, limit: 50 });
      if (response?.notifications) {
        const readIds = await getReadNotificationIds();
        const unread = response.notifications.filter((n: any) => !readIds.has(n.id));
        setUnreadCount(unread.length);
        await saveUnreadCount(unread.length);
      }
    } catch {
      // Fallback to cached count
      const cached = await getUnreadCount();
      setUnreadCount(cached);
    }
  }, []);

  const clearBadge = useCallback(() => {
    setUnreadCount(0);
    saveUnreadCount(0);
  }, []);

  // Load cached count on mount
  useEffect(() => {
    getUnreadCount().then(setUnreadCount);
  }, []);

  return (
    <NotificationBadgeContext.Provider value={{ unreadCount, refreshUnreadCount, clearBadge }}>
      {children}
    </NotificationBadgeContext.Provider>
  );
};

export const useNotificationBadge = () => useContext(NotificationBadgeContext);
