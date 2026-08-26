import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import AdminVerifyButtons from '@/components/AdminVerifyButtons';

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (profile.role !== 'admin') redirect('/');

  const supabase = createClient();

  // Pending photographer verifications
  const { data: pending } = await supabase
    .from('photographers')
    .select(
      'id, phone, email, instagram, city, verification_status, user_id'
    )
    .eq('verification_status', 'pending');

  // All photographers
  const { data: photographers } = await supabase
    .from('photographers')
    .select(
      'id, user_id, city, email, verification_status'
    )
    .order('city');

  // All profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role');

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

  const customerCount =
    (profiles || []).filter((p) => p.role === 'customer').length;

  const photographerCount = (photographers || []).length;

  const bookingCount = (bookings || []).length;

  const pendingCount = (pending || []).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">
        SnapBook Admin
      </h1>

      <p className="mt-2 text-gray-600">
        Manage photographers, customers and bookings.
      </p>

      {/* Overview */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-gray-500">Photographers</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {photographerCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Customers</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {customerCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Bookings</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {bookingCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">
            Pending verifications
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {pendingCount}
          </p>
        </Card>
      </div>

      {/* Pending verifications */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          Pending verifications
        </h2>

        <div className="mt-5 flex flex-col gap-3">
          {(pending || []).map((p) => (
            <Card key={p.id}>
              <h3 className="font-semibold text-gray-900">
                {profileMap.get(p.user_id)?.full_name ||
                  'Photographer'}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Phone: {p.phone}
              </p>

              <p className="text-sm text-gray-600">
                Email: {p.email}
              </p>

              <p className="text-sm text-gray-600">
                Instagram: {p.instagram}
              </p>

              <p className="text-sm text-gray-600">
                City: {p.city}
              </p>

              <AdminVerifyButtons photographerId={p.id} />
            </Card>
          ))}

          {pendingCount === 0 && (
            <Card>
              <p className="text-gray-500">
                No pending verifications.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Photographers */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          Photographers
        </h2>

        <div className="mt-5 flex flex-col gap-3">
          {(photographers || []).map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {profileMap.get(p.user_id)?.full_name ||
                      'Photographer'}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {p.city} · {p.email}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                  {p.verification_status}
                </span>
              </div>
            </Card>
          ))}

          {photographerCount === 0 && (
            <p className="text-gray-500">
              No photographers found.
            </p>
          )}
        </div>
      </section>

      {/* Customers */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          Customers
        </h2>

        <div className="mt-5 flex flex-col gap-3">
          {(profiles || [])
            .filter((p) => p.role === 'customer')
            .map((customer) => (
              <Card key={customer.id}>
                <h3 className="font-semibold text-gray-900">
                  {customer.full_name || 'Customer'}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Customer account
                </p>
              </Card>
            ))}

          {customerCount === 0 && (
            <p className="text-gray-500">
              No customers found.
            </p>
          )}
        </div>
      </section>

      {/* Bookings */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          All bookings
        </h2>

        <div className="mt-5 flex flex-col gap-3">
          {(bookings || []).map((booking) => {
            const customer = profileMap.get(
              booking.customer_id
            );

            const photographer = photographerMap.get(
              booking.photographer_id
            );

            const photographerProfile = photographer
              ? profileMap.get(photographer.user_id)
              : null;

            return (
              <Card key={booking.id}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">
                    {booking.event_type}
                  </h3>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                    {booking.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Date: {booking.event_date}
                </p>

                <p className="text-sm text-gray-600">
                  Location: {booking.location}
                </p>

                <p className="text-sm text-gray-600">
                  Customer:{' '}
                  {customer?.full_name || 'Customer'}
                </p>

                <p className="text-sm text-gray-600">
                  Photographer:{' '}
                  {photographerProfile?.full_name ||
                    'Photographer'}
                </p>
              </Card>
            );
          })}

          {bookingCount === 0 && (
            <p className="text-gray-500">
              No bookings found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
      }
