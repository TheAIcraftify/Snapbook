'use client';

import { useState } from 'react';

type Props = {
  bookingId: string;
  customerId: string;
  photographerId: string;
};

export default function ReviewForm({
  bookingId,
  customerId,
  photographerId,
}: Props) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submitReview() {
    setMessage('');

    if (!rating) {
      setMessage('Please select a rating.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          customer_id: customerId,
          photographer_id: photographerId,
          rating,
          review,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || 'Something went wrong.');
        return;
      }

      setMessage('Review submitted successfully.');
      setReview('');
      setRating(0);
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Leave a review
      </h3>

      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700">
          Rating
        </label>

        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${
                star <= rating ? 'text-yellow-500' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700">
          Review
        </label>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review..."
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      <button
        type="button"
        onClick={submitReview}
        disabled={loading}
        className="mt-3 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}
