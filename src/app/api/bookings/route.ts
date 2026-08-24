import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

  if (profile?.role !== 'customer') {
    return NextResponse.json({ error: 'Only customers can create bookings.' }, { status: 403 });
  }

  const body = await request.json();
  const { photographer_id, event_date, event_type, location, message } = body;

  if (!photographer_id || !event_date || !event_type || !location) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: user.id,
      photographer_id,
      event_date,
      event_type,
      location,
      message: message || '',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
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

  if (profile?.role === 'customer') {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data });
  }

  if (profile?.role === 'photographer') {
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!photographer) {
      return NextResponse.json({ bookings: [] });
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('photographer_id', photographer.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data });
  }

  return NextResponse.json({ error: 'Unauthorized role.' }, { status: 403 });
      }
export async function PATCH(request: NextRequest) {
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

  if (profile?.role !== 'photographer') {
    return NextResponse.json(
      { error: 'Only photographers can update bookings.' },
      { status: 403 }
    );
  }

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!photographer) {
    return NextResponse.json(
      { error: 'Photographer profile not found.' },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { booking_id, status } = body;

  if (!booking_id || !['accepted', 'declined'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid booking ID or status.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', booking_id)
    .eq('photographer_id', photographer.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ booking: data });
       }
