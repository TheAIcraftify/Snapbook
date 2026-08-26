import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminVerifyButtons from '@/components/AdminVerifyButtons';

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (profile.role !== 'admin') redirect('/');

  const supabase = createClient();

  // Pending photographer verifications
  const { data: pendingPhotographers } = await supabase
    .from('photographers')
    .select('id, user_id, verification_status')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });

  // All photographers
  const { data: photographers } = await supabase
    .from('photographers')
    .select('id, user_id, verification_status')
    .order('created_at', { ascending: false });

  // All profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('created_at', { ascending: false });

  // All bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, customer_id, photographer_id, event_date, event_type, location, status, created_at'
    )
    .order('created_at', { ascending: false });

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  const photographerMap = new Map(
    (photographers || []).map((p) => [p.id, p])
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">
        Admin Dashboard
      </h1>

      {/* Pending Verifications */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          Pending verifications
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          {(pendingPhotographers || []).map((photographer) => {
            const photographerProfile = profileMap.get(
              photographer.user_id
            );

            return (
              <div
                key={photographer.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {photographerProfile?.full_name ||
                        'Photographer'}
                    </h3>

                    <p className="mt-1 text-gray-500">
                      Photographer verification request
                    </p>
                  </div>

                  <AdminVerifyButtons
                    photographerId={photographer.id}
                  />
                </div>
              </div>
            );
          })}

          {(!pendingPhotographers ||
            pendingPhotographers.length === 0) && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-gray-500">
                No pending verifications.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Photographers */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">
          Photographers
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          {(photographers || []).map((photographer) => {
            const photographerProfile = profileMap.get(
              photographer.user_id
            );

            return (
              <div
                key={photographer.id}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {photographerProfile?.full_name ||
                        'Photographer'}
                    </h3>

                    <p className="mt-1 text-gray-500">
                      Photographer account
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize text-gray-600">
                    {photographer.verification_status}
                  </span>
                </div>
              </div>
            );
          })}

          {(!photographers ||
            photographers.length === 0) && (
            <p className="text-gray-500">
              No photographers found.
            </p>
          )}
        </div>
      </section>

      {/* Customers */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">
          Customers
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          {(profiles || [])
            .filter((p) => p.role === 'customer')
            .map((customer) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">
                  {customer.full_name || 'Customer'}
                </h3>

                <p className="mt-1 text-gray-500">
                  Customer account
                </p>
              </div>
            ))}

          {(!profiles ||
            profiles.filter((p) => p.role === 'customer').length ===
              0) && (
            <p className="text-gray-500">
              No customers found.
            </p>
          )}
        </div>
      </section>

      {/* All Bookings */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">
          All bookings
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          {(bookings || []).map((booking) => {
            const customer = profileMap.get(booking.customer_id);
            const photographer = photographerMap.get(
              booking.photographer_id
            );

            const photographerProfile = photographer
              ? profileMap.get(photographer.user_id)
              : undefined;

            return (
              <div
                key={booking.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {booking.event_type}
                    </h3>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize text-gray-600">
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>
                      <span className="font-medium text-gray-700">
                        Date:
                      </span>{' '}
                      {booking.event_date}
                    </p>

                    <p>
                      <span className="font-medium text-gray-700">
                        Location:
                      </span>{' '}
                      {booking.location}
                    </p>

                    <p>
                      <span className="font-medium text-gray-700">
                        Customer:
                      </span>{' '}
                      {customer?.full_name || 'Unknown customer'}
                    </p>

                    <p>
                      <span className="font-medium text-gray-700">
                        Photographer:
                      </span>{' '}
                      {photographerProfile?.full_name ||
                        'Unknown photographer'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {(!bookings || bookings.length === 0) && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-gray-500">
                No bookings found.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
          }
