import { createClient } from '@/lib/supabase/server';
import PhotographerCard from "@/components/photographers/PhotographerCard";
import type { Photographer, Profile } from '@/lib/types/database';

export default async function PhotographersPage() {
  const supabase = createClient();

  const { data: photographers } = await supabase
    .from('photographers')
    .select('id, user_id, city, categories, price_range, verification_status')
    .eq('verification_status', 'verified');

  const userIds = (photographers || []).map((p) => p.user_id);

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Profile[] };

  const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  const photographerIds = (photographers || []).map((p) => p.id);

  const { data: reviews } = photographerIds.length
    ? await supabase
        .from('reviews')
        .select('photographer_id, rating')
        .in('photographer_id', photographerIds)
    : { data: [] as { photographer_id: string; rating: number }[] };

  const ratingMap = new Map<string, number>();
  const groupedRatings = new Map<string, number[]>();

  (reviews || []).forEach((r) => {
    const existing = groupedRatings.get(r.photographer_id) || [];
    existing.push(r.rating);
    groupedRatings.set(r.photographer_id, existing);
  });

  groupedRatings.forEach((ratings, photographerId) => {
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    ratingMap.set(photographerId, Math.round(avg * 10) / 10);
  });

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
            rating={ratingMap.get(p.id) || 0}
          />
        ))}
      </div>
      {(!photographers || photographers.length === 0) && (
        <p className="mt-6 text-gray-500">No verified photographers yet. Check back soon.</p>
      )}
    </div>
  );
}
