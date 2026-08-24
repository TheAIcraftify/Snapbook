'use client';

import { useState } from 'react';

type Props = {
  bookingId: string;
  status: string;
};

export default function BookingActions({ bookingId, status }: Props) {
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: 'accepted' | 'declined') {
    setLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Something went wrong.');
        return;
      }

      window.location.reload();
    } catch {
      alert('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (status !== 'pending') {
    return null;
  }

  return (
    <div className="mt-4 flex gap-3">
      <button
        onClick={() => updateStatus('accepted')}
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Accept'}
      </button>

      <button
        onClick={() => updateStatus('declined')}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
