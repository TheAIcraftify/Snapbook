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

  // Prevent bookings for past dates
  const today = new Date().toISOString().split('T')[0];

  if (event_date < today) {
    return NextResponse.json(
      { error: 'You cannot request a booking for a past date.' },
      { status: 400 }
    );
  }

  // Check if photographer already has a pending or accepted
  // booking on the requested date.
  const { data: existingBooking, error: existingBookingError } =
    await supabase
      .from('bookings')
      .select('id')
      .eq('photographer_id', photographer_id)
      .eq('event_date', event_date)
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

  if (existingBookingError) {
    return NextResponse.json(
      { error: existingBookingError.message },
      { status: 500 }
    );
  }

  if (existingBooking) {
    return NextResponse.json(
      {
        error:
          'This photographer is already booked for the selected date.',
      },
      { status: 409 }
    );
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
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { booking: data },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
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

  if (
