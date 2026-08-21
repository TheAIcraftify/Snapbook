import { createClient } from '@/lib/supabase/server';
import PhotographerCard from '@/components/PhotographerCard';
import type { Photographer, Profile } from '@/lib/types';

export default async function PhotographersPage() {
  const supabase = createClient();

  const { data: photographers } = await supabase
    .from('photographers')
    .select('id, user_id, city, categories, price_range, rating, verification_status')
    .eq('verification_status', 'verified');

  const userIds = (photographers || []).map((p) => p.user_id);

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Profile[] };

  const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Browse photographers</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {(photographers || []).map((p) => (
          <PhotographerCard
            key={p.id}
            id={p.id}
            fullName={nameMap.get(p.user_id) || 'Photographer'}
            city={p.city}
            categories={p.categories}
            priceRange={p.price_range}
            rating={p.rating}
          />
        ))}
      </div>
      {(!photographers || photographers.length === 0) && (
        <p className="mt-6 text-gray-500">No verified photographers yet. Check back soon.</p>
      )}
    </div>
  );
}
