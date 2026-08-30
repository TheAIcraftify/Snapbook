'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface Availability {
  id: string;
  photographer_id: string;
  available_date: string;
  is_available: boolean;
}

export default function PhotographerAvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  async function loadAvailability() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/photographer/availability');

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to load availability.'
        );
      }

      setAvailability(data.availability || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load availability.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  async function updateAvailability(
    date: string,
    isAvailable: boolean
  ) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/photographer/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          available_date: date,
          is_available: isAvailable,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to update availability.'
        );
      }

      setMessage(
        isAvailable
          ? `${date} marked as available.`
          : `${date} marked as unavailable.`
      );

      setSelectedDate('');
      await loadAvailability();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update availability.'
      );
    } finally {
      setSaving(false);
    }
  }

  function getStatus(date: string) {
    const record = availability.find(
      (item) => item.available_date === date
    );

    if (!record) {
      return null;
    }

    return record.is_available;
  }

  const unavailableDates = availability
    .filter((item) => !item.is_available)
    .sort((a, b) =>
      a.available_date.localeCompare(b.available_date)
    );

  const availableDates = availability
    .filter((item) => item.is_available)
    .sort((a, b) =>
      a.available_date.localeCompare(b.available_date)
    );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Availability
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Choose the dates when you are unavailable for new
          photography bookings.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">
          Manage a date
