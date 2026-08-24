'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface AdminVerifyButtonsProps {
  photographerId: string;
}

export default function AdminVerifyButtons({ photographerId }: AdminVerifyButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'verify' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(verification_status: 'verified' | 'rejected') {
    setLoading(verification_status === 'verified' ? 'verify' : 'reject');
    setError(null);

    const res = await fetch(`/api/admin/photographers/${photographerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_status }),
    });

    setLoading(null);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Something went wrong.');
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => handleAction('verified')} disabled={loading !== null}>
          {loading === 'verify' ? 'Approving...' : 'Approve'}
        </Button>
        <Button
          variant="danger"
          onClick={() => handleAction('rejected')}
          disabled={loading !== null}
        >
          {loading === 'reject' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
}
