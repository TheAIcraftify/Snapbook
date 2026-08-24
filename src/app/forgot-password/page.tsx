'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      'If an account exists with this email, a password reset link has been sent.'
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">
        Forgot password
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        Enter your email and we&apos;ll send you a password reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

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

        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="text-brand-600 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
