import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can verify photographers.' }, { status: 403 });
  }

  const body = await request.json();
  const { verification_status } = body;

  if (!['verified', 'rejected'].includes(verification_status)) {
    return NextResponse.json({ error: 'Invalid verification status.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('photographers')
    .update({ verification_status })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
