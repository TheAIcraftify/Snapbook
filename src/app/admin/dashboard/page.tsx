import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AdminVerifyButtons from '@/components/AdminVerifyButtons';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // 1. Check authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Login Required
        </h1>

        <p className="mt-4 text-gray-600">
          Your login session could not be verified.
        </p>

        <p className="mt-2 text-sm text-red-600">
          {authError?.message || 'No authenticated user found.'}
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
        >
          Login Again
        </Link>
      </div>
    );
  }

  // 2. Fetch current user's profile
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  // 3. Show profile debugging instead of hiding the reason
  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900">
          Profile Not Found
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">
            Authentication successful, but profile could not be loaded.
          </p>

          <p className="mt-4 text-sm text-gray-700">
            User ID: {user.id}
          </p>

          <p className="mt-2 text-sm text-red-700">
            Profile Error: {profileError?.message || 'No profile found'}
          </p>
        </div>
      </div>
    );
  }

  // 4. Check admin role
  if (profile.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Access Required
        </h1>

        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-gray-700">
            Your account is logged in, but does not have admin access.
          </p>

          <p className="mt-3 text-sm text-gray-700">
            Current Role: {profile.role}
          </p>

          <p className="mt-2 text-sm text-gray-700">
            User ID: {user.id}
          </p>
        </div>
      </div>
    );
  }

  // 5. Fetch dashboard data
  const [
    pendingResult,
    photographersResult,
    profilesResult,
    bookingsResult,
  ] = await Promise.all([
    supabase
      .from('photographers')
      .select('id, user_id, verification_status')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false }),

    supabase
      .from('photographers')
      .select('id, user_id, verification_status')
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('created_at', { ascending: false }),

    supabase
      .from('bookings')
      .select(
        'id, customer_id, photographer_id, event_date, event_type, location, status, created_at'
      )
      .order('created_at', { ascending: false }),
  ]);

  const pendingPhotographers = pendingResult.data || [];
  const photographers = photographersResult.data || [];
  const profiles = profilesResult.data || [];
  const bookings = bookingsResult.data || [];

  const dashboardErrors = [
    pendingResult.error?.message,
    photographersResult.error?.message,
    profilesResult.error?.message,
    bookingsResult.error?.message,
  ].filter(Boolean);

  const profileMap = new Map(
    profiles.map((p) => [p.id, p])
  );

  const photographerMap = new Map(
    photographers.map((p) => [p.id, p])
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Dashboard Header */}
      <h1 className="text-3xl font-bold text-gray-900">
        Admin Dashboard
      </h1>

      <p className="mt-2 text-gray-500">
        Welcome, {profile.full_name || 'Admin'}
      </p>

      {/* Admin Session Information */}
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
        <h2 className="font-semibold text-green-800">
          Admin Authentication Successful
        </h2>

        <p className="mt-2 text-sm text-green-700">
          Role: {profile.role}
        </p>
      </div>

      {/* Dashboard Query Errors */}
      {dashboardErrors.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Dashboard Data Errors
          </h2>

          {dashboardErrors.map((error, index) => (
            <p key={index} className="mt-2 text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Dashboard Summary */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Pending Verifications
          </p>
          <p className="mt-2 text-3xl font-bold">
            {pendingPhotographers.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Photographers
          </p>
          <p className="mt-2 text-3xl font-bold">
            {photographers.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Customers
          </p>
          <p className="mt-2 text-3xl font-bold">
            {profiles.filter((p) => p.role === 'customer').length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Bookings
          </p>
          <p className="mt-2 text-3xl font-bold">
            {bookings.length}
          </p>
        </div>
      </section>

      {/* Pending Verifications */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">
          Pending Verifications
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          {pendingPhotographers.map((photographer) => {
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
                      {photographerProfile?.full_name || 'Photographer'}
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

          {pendingPhotographers.length === 0 && (
            <div className="rounded-2xl border bg-white p-6">
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
          {photographers.map((photographer) => {
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
                      {photographerProfile?.full_name || 'Photographer'}
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

          {photographers.length === 0 && (
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
          {profiles
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

          {profiles.filter((p) => p.role === 'customer').length === 0 && (
            <p className="text-gray-500">
              No customers found.
            </p>
          )}
        </div>
      </section>

      {/* All Bookings */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">
          All Bookings
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          {bookings.map((booking) => {
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
                      <strong className="text-gray-700">Date:</strong>{' '}
                      {booking.event_date}
                    </p>

                    <p>
                      <strong className="text-gray-700">Location:</strong>{' '}
                      {booking.location}
                    </p>

                    <p>
                      <strong className="text-gray-700">Customer:</strong>{' '}
                      {customer?.full_name || 'Unknown customer'}
                    </p>

                    <p>
                      <strong className="text-gray-700">Photographer:</strong>{' '}
                      {photographerProfile?.full_name || 'Unknown photographer'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 && (
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
