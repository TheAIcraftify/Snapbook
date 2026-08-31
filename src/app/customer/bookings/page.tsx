import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import ReviewForm from '@/components/ReviewForm';
import TipForm from '@/components/TipForm';

export default async function CustomerBookingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (profile.role !== 'customer') redirect('/');

  const supabase = createClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, event_date, event_type, location, status, photographer_id, created_at'
    )
    .eq('customer_id', profile.id)
    .order('created_at', { ascending: false });

  const bookingIds = (bookings || []).map((b) => b.id);

  const { data: reviews } = bookingIds.length
    ? await supabase
        .from('reviews')
        .select('booking_id')
        .eq('customer_id', profile.id)
        .in('booking_id', bookingIds)
    : { data: [] };

  const reviewedBookingIds = new Set(
    (reviews || []).map((r) => r.booking_id)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">
        My bookings
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        {(bookings || []).map((b) => (
          <Card key={b.id}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {b.event_type}
              </h2>

              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                {b.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {b.event_date} · {b.location}
            </p>

            {b.status === 'completed' && b.photographer_id && (
              <>
                {reviewedBookingIds.has(b.id) ? (
                  <p className="mt-4 text-sm text-green-600">
                    You have already reviewed this booking.
                  </p>
                ) : (
                  <ReviewForm
                    bookingId={b.id}
                    photographerId={b.photographer_id}
                  />
                )}

                <TipForm
                  bookingId={b.id}
                  photographerId={b.photographer_id}
                />
              </>
            )}
          </Card>
        ))}

        {(!bookings || bookings.length === 0) && (
          <p className="text-gray-500">
            You haven&apos;t requested any bookings yet.
          </p>
        )}
      </div>
    </div>
  );
}
