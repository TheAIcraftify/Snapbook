'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  booking_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');

  async function loadNotifications() {
    try {
      setLoading(true);

      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Unable to load notifications.');
        return;
      }

      setNotifications(data.notifications || []);
    } catch {
      setMessage('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
        }),
      });

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch {
      // Ignore read-state errors.
    }
  }

  async function handleNotificationClick(
    notification: Notification
  ) {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.booking_id) {
      router.push(
        `/customer/bookings/${notification.booking_id}`
      );
    }
  }

  async function createTestNotification() {
    setTesting(true);
    setMessage('');

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || 'Unable to create test notification.'
        );
        return;
      }

      setMessage('Test notification created.');
      await loadNotifications();
    } catch {
      setMessage(
        'Unable to create test notification.'
      );
    } finally {
      setTesting(false);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Stay updated with your SnapBook activity.
          </p>
        </div>

        <button
          type="button"
          onClick={createTestNotification}
          disabled={testing}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {testing
            ? 'Creating...'
            : 'Test Notification'}
        </button>
      </div>

      {unreadCount > 0 && (
        <div className="mt-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          You have {unreadCount} unread notification
          {unreadCount !== 1 ? 's' : ''}.
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-gray-600">
          {message}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">🔔</div>

            <h2 className="mt-3 font-semibold text-gray-900">
              No notifications yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              You&apos;ll see your SnapBook updates here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() =>
                handleNotificationClick(notification)
              }
              className={`block w-full border-b border-gray-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-gray-50 ${
                !notification.is_read
                  ? 'bg-blue-50/40'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.is_read
                      ? 'bg-gray-300'
                      : 'bg-brand-500'
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-gray-900">
                      {notification.title}
                    </h2>

                    {!notification.is_read && (
                      <span className="shrink-0 text-xs font-medium text-brand-600">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(
                      notification.created_at
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </main>
  );
}
