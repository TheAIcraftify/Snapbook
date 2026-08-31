import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PortfolioManager from '@/components/photographers/PortfolioManager';

export default async function PhotographerDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (profile.role !== 'photographer') redirect('/');

  const supabase = createClient();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id, verification_status, rating')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!photographer) {
    redirect('/photographer/onboarding');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {profile.full_name}
      </h1>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Verification status
        </h2>

        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-sm ${
            photographer.verification_status === 'verified'
              ? 'bg-green-100 text-green-700'
              : photographer.verification_status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {photographer.verification_status}
        </span>

        {photographer.verification_status === 'pending' && (
          <p className="mt-2 text-sm text-gray-500">
            An admin is reviewing your profile. This usually takes 1-2 days.
          </p>
        )}
      </Card>

      <Link href="/photographer/bookings">
        <Card className="mt-4 hover:shadow-md">
          <h2 className="font-semibold text-gray-900">
            My bookings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and respond to booking requests.
          </p>
        </Card>
      </Link>

      <PortfolioManager />
    </div>
  );
}
