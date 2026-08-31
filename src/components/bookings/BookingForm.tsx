'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  photographerId: string;
}

export default function BookingForm({
  photographerId,
}: BookingFormProps) {
  const router = useRouter();

  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadBookingAvailability() {
      try {
        const [bookingsRes, availabilityRes] = await Promise.all([
          fetch(
            `/api/bookings?photographer_id=${photographerId}`
          ),
          fetch(
            `/api/photographer/availability?photographer_id=${photographerId}`
          ),
        ]);

        if (!bookingsRes.ok) {
          throw new Error('Failed to load booked dates');
        }

        if (!availabilityRes.ok) {
          throw new Error(
            'Failed to load photographer availability'
          );
        }

        const bookingsData = await bookingsRes.json();
        const availabilityData = await availabilityRes.json();

        setBookedDates(bookingsData.bookedDates || []);
        setUnavailableDates(
          availabilityData.unavailableDates || []
        );
      } catch {
        setError('Unable to load booking availability.');
      } finally {
        setLoadingDates(false);
      }
    }

    loadBookingAvailability();
  }, [photographerId]);

  function handleDateChange(value: string) {
    setError(null);

    if (bookedDates.includes(value)) {
      setEventDate('');
      setError(
        'This date is already booked. Please select another date.'
      );
      return;
    }

    if (unavailableDates.includes(value)) {
      setEventDate('');
      setError(
        'This photographer is unavailable on the selected date. Please select another date.'
      );
      return;
    }

    setEventDate(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (bookedDates.includes(eventDate)) {
      setError(
        'This date is already booked. Please select another date.'
      );
      return;
    }

    if (unavailableDates.includes(eventDate)) {
      setError(
        'This photographer is unavailable on the selected date. Please select another date.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photographer_id: photographerId,
          event_date: eventDate,
          event_type: eventType,
          location,
          message,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(
          body.error || 'Something went wrong. Please try again.'
        );
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="rounded-lg bg-green-50 p-4 text
