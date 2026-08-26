'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  photographerId: string;
}

export default function BookingForm({ photographerId }: BookingFormProps) {
  const router = useRouter();

  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Today's date — past dates cannot be selected
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photographer_id: photographerId,
        event_date: eventDate,
        event_type: eventType,
        location,
        message,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Something went wrong. Please try again.');
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-green-700">
        Booking request sent. The photographer will respond soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Event date"
        type="date"
        value={eventDate}
        min={today}
        onChange={(e) => setEventDate(e.target.value)}
        required
      />

      <Input
        label="Event type"
        placeholder="Wedding, portrait, event..."
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        required
      />

      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Message
        </label>

        <textarea
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Request booking'}
      </Button>
    </form>
  );
}
