import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  recentAlert: Notification | null;
  dismissRecentAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentAlert, setRecentAlert] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    if (!token || !user) return;
    try {
      const data = await apiRequest<{ notifications: Notification[] }>('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, token]);

  // Connect to SSE stream for real-time events
  useEffect(() => {
    if (!token || !user) return;

    const eventSource = new EventSource('/api/v1/notifications/stream');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'notification_received' && payload.data.userId === user.id) {
          setNotifications((prev) => [payload.data, ...prev]);
          setRecentAlert(payload.data);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user, token]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        recentAlert,
        dismissRecentAlert: () => setRecentAlert(null)
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
