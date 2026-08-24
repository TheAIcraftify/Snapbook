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

  const { data: pending } = await supabase
    .from('photographers')
    .select('id, phone, email, instagram, city, verification_status, user_id')
    .eq('verification_status', 'pending');

  const userIds = (pending || []).map((p) => p.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] };

  const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Pending verifications</h1>
      <div className="mt-6 flex flex-col gap-3">
        {(pending || []).map((p) => (
          <Card key={p.id}>
            <h2 className="font-semibold text-gray-900">{nameMap.get(p.user_id) || 'Photographer'}</h2>
            <p className="mt-1 text-sm text-gray-600">Phone: {p.phone}</p>
            <p className="text-sm text-gray-600">Email: {p.email}</p>
            <p className="text-sm text-gray-600">Instagram: {p.instagram}</p>
            <p className="text-sm text-gray-600">City: {p.city}</p>
            <AdminVerifyButtons photographerId={p.id} />
          </Card>
        ))}
        {(!pending || pending.length === 0) && (
          <p className="text-gray-500">No pending verifications.</p>
        )}
      </div>
    </div>
  );
}
