import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'You must be logged in.' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'customer') {
    return NextResponse.json(
      { error: 'Only customers can create bookings.' },
      { status: 403 }
    );
  }

  const body = await request.json();

  const {
    photographer_id,
    event_date,
    event_type,
    location,
    message,
  } = body;

  if (!photographer_id || !event_date || !event_type || !location) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split('T')[0];

  if (event_date < today) {
    return NextResponse.json(
      { error: 'You cannot request a booking for a past date.' },
      { status: 400
