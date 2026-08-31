'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  booking_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function Navbar() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  async function loadNotifications() {
    setLoadingNotifications(true);

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userEmail = data.user?.email ?? null;
      setEmail(userEmail);

      if (userEmail) {
        loadNotifications();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email ?? null;

      setEmail(userEmail);

      if (userEmail) {
        loadNotifications();
      } else {
        setNotifications([]);
        setShowNotifications(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
      // Ignore update errors.
    }
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.booking_id) {
      window.location.href = `/customer/bookings/${notification.booking_id}`;
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-xl font-bold text-brand-600"
        >
          SnapBook
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/photographers"
            className="text-gray-700 hover:text-brand-600"
          >
            Browse
          </Link>

          {email ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !showNotifications;
                    setShowNotifications(nextState);

                    if (nextState) {
                      loadNotifications();
                    }
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 hover:text-brand-600"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <span className="text-lg">🔔</span>

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                              !notification.is_read
                                ? 'bg-blue-50/50'
                                : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                  notification.is_read
                                    ? 'bg-transparent'
                                    : 'bg-brand-500'
                                }`}
                              />

                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">
                                  {notification.title}
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                  {notification.message}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
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
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="text-gray-700 hover:text-brand-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-700 hover:text-brand-600"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
