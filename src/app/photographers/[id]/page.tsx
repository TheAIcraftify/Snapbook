import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import BookingForm from "@/components/bookings/BookingForm";
import Card from '@/components/ui/Card';
import { notFound } from 'next/navigation';

export default async function PhotographerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const currentProfile = await getCurrentProfile();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id, user_id, bio, categories, city, price_range, portfolio_urls, verification_status')
    .eq('id', params.id)
    .single();

  if (!photographer) {
    notFound();
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', photographer.user_id)
    .single();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('photographer_id', photographer.id);

  const reviewCount = (reviews || []).length;
  const averageRating = reviewCount > 0
    ? Math.round(
        ((reviews || []).reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
      ) / 10
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
      <p className="mt-1 text-gray-500">
        {photographer.city} · {photographer.price_range} · ★ {averageRating.toFixed(1)}
        {reviewCount > 0 && (
          <span className="text-sm text-gray-400"> ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
        )}
      </p>
      <p className="mt-4 text-gray-700">{photographer.bio}</p>
      <p className="mt-2 text-sm text-gray-600">{photographer.categories.join(', ')}</p>

      {photographer.portfolio_urls?.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photographer.portfolio_urls.map((url: string, idx: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={idx} src={url} alt="Portfolio work" className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
      )}

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Request a booking</h2>
        {currentProfile ? (
          currentProfile.role === 'customer' ? (
            <div className="mt-4">
              <BookingForm photographerId={photographer.id} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Only customers can request bookings.
            </p>
          )
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Please log in as a customer to request a booking.
          </p>
        )}
      </Card>
    </div>
  );
}
