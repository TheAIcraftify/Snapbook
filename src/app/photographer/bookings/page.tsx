import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import BookingActions from '@/components/BookingActions';

export default async function PhotographerBookingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (profile.role !== 'photographer') redirect('/');

  const supabase = createClient();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!photographer) redirect('/photographer/onboarding');

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, event_date, event_type, location, message, status, created_at'
    )
    .eq('photographer_id', photographer.id)
    .order('created_at', { ascending: false });

  const bookingIds = (bookings || []).map((b) => b.id);

  const { data: tips } = bookingIds.length
    ? await supabase
        .from('tips')
        .select('booking_id, amount, status, paid_at')
        .eq('photographer_id', photographer.id)
        .in('booking_id', bookingIds)
    : { data: [] };

  const tipsByBooking = new Map(
    (tips || []).map((tip) => [tip.booking_id, tip])
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">
        Booking requests
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        {(bookings || []).map((b) => {
          const tip = tipsByBooking.get(b.id);

          return (
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

              {b.message && (
                <p className="mt-2 text-sm text-gray-600">
                  {b.message}
                </p>
              )}

              <BookingActions
                bookingId={b.id}
                status={b.status}
              />

              {tip &&
                (b.status === 'accepted' || b.status === 'completed') && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Tip
                    </h3>

                    <p className="mt-1 text-xl font-bold text-gray-900">
                      ₹{Number(tip.amount).toLocaleString('en-IN')}
                    </p>

                    <p className="mt-1 text-sm capitalize text-gray-500">
                      Status: {tip.status}
                    </p>

                    {tip.paid_at && (
                      <p className="mt-1 text-xs text-green-600">
                        Paid
                      </p>
                    )}
                  </div>
                )}
            </Card>
          );
        })}

        {(!bookings || bookings.length === 0) && (
          <p className="text-gray-500">
            No booking requests yet.
          </p>
        )}
      </div>
    </div>
  );
}
