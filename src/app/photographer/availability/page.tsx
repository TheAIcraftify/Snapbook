'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
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

      setAvailability((current) => {
        const existing = current.find(
          (item) => item.available_date === date
        );

        if (existing) {
          return current.map((item) =>
            item.available_date === date
              ? data.availability
              : item
          );
        }

        return [...current, data.availability];
      });

      setMessage(
        isAvailable
          ? 'Date marked as available.'
          : 'Date marked as unavailable.'
      );
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
    const item = availability.find(
      (entry) => entry.available_date === date
    );

    return item?.is_available ?? false;
  }

  const selectedStatus = selectedDate
    ? getStatus(selectedDate)
    : false;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Availability
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Choose the dates when you are available for photography
          bookings.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Select date"
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setError(null);
              setMessage(null);
            }}
            disabled={loading || saving}
          />

          {selectedDate && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Current status
              </p>

              <p
                className={`mt-1 font-medium ${
                  selectedStatus
                    ? 'text-green-600'
                    : 'text-gray-700'
                }`}
              >
                {selectedStatus
                  ? 'Available'
                  : 'Not marked as available'}
              </p>
            </div>
          )}

          {selectedDate && (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  updateAvailability(selectedDate, true)
                }
              >
                {saving ? 'Saving...' : 'Mark available'}
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  updateAvailability(selectedDate, false)
                }
              >
                Mark unavailable
              </Button>
            </div>
          )}

          {loading && (
            <p className="text-sm text-gray-500">
              Loading availability...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-green-600">
              {message}
            </p>
          )}
        </div>
      </div>

      {!loading && availability.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Saved dates
          </h2>

          <div className="mt-4 flex flex-col gap-3">
            {availability
              .slice()
              .sort((a, b) =>
                a.available_date.localeCompare(
                  b.available_date
                )
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm text-gray-700">
                    {item.available_date}
                  </span>

                  <span
                    className={`text-sm font-medium ${
                      item.is_available
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.is_available
                      ? 'Available'
                      : 'Unavailable'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!loading && availability.length === 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No availability dates added yet.
          </p>
        </div>
      )}
    </main>
  );
}
