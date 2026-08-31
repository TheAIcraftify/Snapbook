'use client';

import { useState } from 'react';

type TipFormProps = {
  bookingId: string;
  photographerId: string;
};

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function TipForm({
  bookingId,
  photographerId,
}: TipFormProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectedAmount =
    amount === 0 ? Number(customAmount) : amount;

  async function loadRazorpay() {
    if (typeof window === 'undefined') return false;

    if ((window as any).Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');

      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function submitTip() {
    setMessage('');

    if (!selectedAmount || selectedAmount <= 0) {
      setMessage('Please select or enter a valid tip amount.');
      return;
    }

    if (selectedAmount < 1) {
      setMessage('Tip amount must be at least ₹1.');
      return;
    }

    setLoading(true);

    try {
      const loaded = await loadRazorpay();

      if (!loaded) {
        setMessage(
          'Unable to load Razorpay. Please check your internet connection.'
        );
        return;
      }

      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          photographer_id: photographerId,
          amount: selectedAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || 'Unable to create tip.');
        return;
      }

      const Razorpay = (window as any).Razorpay;

      const options = {
        key: result.key_id,
        amount: result.order.amount,
        currency: result.order.currency,
        name: 'Snapbook',
        description: 'Tip for photographer',
        order_id: result.order.id,

        handler: async function (paymentResponse: any) {
          try {
            const verifyResponse = await fetch(
              '/api/tips/verify',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tip_id: result.tip.id,
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyResult =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              setMessage(
                verifyResult.error ||
                  'Payment verification failed.'
              );
              return;
            }

            setMessage(
              'Tip payment successful. Thank you!'
            );

            setAmount(null);
            setCustomAmount('');
          } catch {
            setMessage(
              'Payment completed, but verification failed.'
            );
          }
        },

        modal: {
          ondismiss: function () {
            setMessage('Payment cancelled.');
          },
        },

        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new Razorpay(options);

      razorpay.on(
        'payment.failed',
        function () {
          setMessage(
            'Payment failed. Please try again.'
          );
        }
      );

      razorpay.open();
    } catch {
      setMessage(
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Give a Tip
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Show your appreciation for the photographer.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={loading}
            onClick={() => {
              setAmount(preset);
              setCustomAmount('');
              setMessage('');
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              amount === preset
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700'
            } disabled:opacity-50`}
          >
            ₹{preset.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setAmount(0);
          setMessage('');
        }}
        className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm font-medium ${
          amount === 0
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 text-gray-700'
        } disabled:opacity-50`}
      >
        Custom amount
      </button>

      {amount === 0 && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700">
            Enter tip amount
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(e) =>
              setCustomAmount(e.target.value)
            }
            placeholder="₹ Enter amount"
            disabled={loading}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
      )}

      <button
        type="button"
        onClick={submitTip}
        disabled={loading || !selectedAmount}
        className="mt-4 w-full rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading
          ? 'Processing...'
          : selectedAmount
          ? `Give ₹${selectedAmount.toLocaleString('en-IN')} Tip`
          : 'Continue'}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}
