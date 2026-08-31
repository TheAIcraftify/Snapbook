import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import BookingForm from '@/components/bookings/BookingForm';
import Card from '@/components/ui/Card';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PortfolioItem = {
  id: string;
  media_type: 'photo' | 'video' | 'bts';
  media_url: string;
  created_at: string;
};

export default async function PhotographerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const currentProfile = await getCurrentProfile();

  const { data: photographer } = await supabase
    .from('photographers')
    .select(
      'id, user_id, bio, categories, city, price_range, verification_status'
    )
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

  // Public-safe reviews:
  // customer_id and booking_id are NOT exposed.
  const { data: reviews } = await supabase
    .from('public_reviews')
    .select('rating, review, created_at')
    .eq('photographer_id', photographer.id)
    .order('created_at', { ascending: false });

  const reviewCount = (reviews || []).length;

  const averageRating =
    reviewCount > 0
      ? Math.round(
          ((reviews || []).reduce((sum, r) => sum + r.rating, 0) /
            reviewCount) *
            10
        ) / 10
      : 0;

  // Portfolio
  const { data: portfolioItems } = await supabase
    .from('portfolio_items')
    .select('id, media_type, media_url, created_at')
    .eq('photographer_id', photographer.id)
    .order('created_at', { ascending: false });

  const portfolio = (portfolioItems || []) as PortfolioItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">
        {profile?.full_name}
      </h1>

      <p className="mt-1 text-gray-500">
        {photographer.city} · {photographer.price_range} · ★{' '}
        {averageRating.toFixed(1)}

        {reviewCount > 0 && (
          <span className="text-sm text-gray-400">
            {' '}
            ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
          </span>
        )}
      </p>

      <p className="mt-4 text-gray-700">{photographer.bio}</p>

      <p className="mt-2 text-sm text-gray-600">
        {photographer.categories?.join(', ')}
      </p>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Portfolio
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                {item.media_type === 'photo' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.media_url}
                    alt="Portfolio work"
                    className="aspect-square w-full object-cover"
                  />
                )}

                {item.media_type === 'video' && (
                  <video
                    src={item.media_url}
                    controls
                    className="aspect-square w-full object-cover"
                  />
                )}

                {item.media_type === 'bts' && (
                  <video
                    src={item.media_url}
                    controls
                    className="aspect-square w-full object-cover"
                  />
                )}

                <div className="px-2 py-2 text-sm text-gray-600">
                  {item.media_type === 'photo'
                    ? 'Photo'
                    : item.media_type === 'video'
                    ? 'Video'
                    : 'Behind the Scenes'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Reviews */}
      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Reviews
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          ★ {averageRating.toFixed(1)} based on {reviewCount} review
          {reviewCount !== 1 ? 's' : ''}.
        </p>

        {reviews && reviews.length > 0 && (
          <div className="mt-5 space-y-4">
            {reviews.map((review, index) => (
              <div
                key={`${review.created_at}-${index}`}
                className="border-t border-gray-100 pt-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>

                  <span className="text-sm text-gray-500">
                    {review.rating}/5
                  </span>
                </div>

                {review.review?.trim() ? (
                  <p className="mt-2 text-gray-700">
                    {review.review}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    No written review.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Booking */}
      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Request a booking
        </h2>

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
