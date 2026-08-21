'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-600">
          SnapBook
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/photographers" className="text-gray-700 hover:text-brand-600">
            Browse
          </Link>
          {email ? (
            <button onClick={handleSignOut} className="text-gray-700 hover:text-brand-600">
              Sign out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-brand-600">
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
