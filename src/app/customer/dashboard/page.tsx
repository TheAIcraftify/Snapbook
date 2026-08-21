import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default async function CustomerDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (profile.role !== 'customer') redirect('/');

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.full_name}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/photographers">
          <Card className="hover:shadow-md">
            <h2 className="font-semibold text-gray-900">Browse photographers</h2>
            <p className="mt-1 text-sm text-gray-500">Find and book a verified photographer</p>
          </Card>
        </Link>
        <Link href="/customer/bookings">
          <Card className="hover:shadow-md">
            <h2 className="font-semibold text-gray-900">My bookings</h2>
            <p className="mt-1 text-sm text-gray-500">Track your booking requests</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
