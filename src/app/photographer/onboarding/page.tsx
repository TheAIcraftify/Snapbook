'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function PhotographerOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [portfolioUrls, setPortfolioUrls] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState('');
  const [city, setCity] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    if (!phone || !email || !instagram || !portfolioUrls) {
      setError('Phone, email, Instagram, and portfolio are all required for verification.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('photographers').insert({
      user_id: user.id,
      phone,
      email,
      instagram,
      portfolio_urls: portfolioUrls.split(',').map((u) => u.trim()).filter(Boolean),
      bio,
      categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
      city,
      price_range: priceRange,
      verification_status: 'pending',
      rating: 0,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push('/photographer/dashboard');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Complete your photographer profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        This information is used for verification only. Your phone, email, and Instagram are
        never shown to customers.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Input label="Contact email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Instagram profile URL"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          required
        />
        <Input
          label="Portfolio image URLs (comma separated)"
          value={portfolioUrls}
          onChange={(e) => setPortfolioUrls(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Bio</label>
          <textarea
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <Input
          label="Categories (comma separated)"
          placeholder="Wedding, portrait, event"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
        />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
        <Input
          label="Price range"
          placeholder="₹15,000 - ₹50,000"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for verification'}
        </Button>
      </form>
    </div>
  );
        }
