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
  created_at?: string;
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

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('photographer_id', photographer.id);

  const reviewCount = reviews?.length ?? 0;

  const averageRating =
    reviewCount > 0
      ? Math.round(
          ((reviews ?? []).reduce(
            (sum, review) => sum + Number(review.rating),
            0
          ) /
            reviewCount) *
            10
        ) / 10
      : 0;

  const { data: portfolioItems } = await supabase
    .from('portfolio_items')
    .select('id, media_type, media_url, created_at')
    .eq('photographer_id', photographer.id)
    .order('created_at', { ascending: false });

  const portfolio = (portfolioItems ?? []) as PortfolioItem[];

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

      {photographer.bio && (
        <p className="mt-4 text-gray-700">{photographer.bio}</p>
      )}

      {photographer.categories?.length > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {photographer.categories.join(', ')}
        </p>
      )}

      {portfolio.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Portfolio
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                {item.media_type === 'photo' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.media_url}
                    alt="Portfolio work"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <video
                    src={item.media_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full bg-black object-contain"
                  />
                )}

                <div className="px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.media_type === 'bts'
                      ? 'Behind the Scenes'
                      : item.media_type === 'video'
                        ? 'Video'
                        : 'Photo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Reviews
        </h2>

        {reviewCount === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No reviews yet.
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            ★ {averageRating.toFixed(1)} based on {reviewCount}{' '}
            review{reviewCount !== 1 ? 's' : ''}.
          </p>
        )}
      </Card>

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
