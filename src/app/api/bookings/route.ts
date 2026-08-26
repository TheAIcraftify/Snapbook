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
      { status: 400 }
    );
  }

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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const photographerId = searchParams.get('photographer_id');

  if (photographerId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('event_date')
      .eq('photographer_id', photographerId)
      .in('status', ['pending', 'accepted']);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookedDates: (data || []).map(
        (booking) => booking.event_date
      ),
    });
  }

  if (profile?.role === 'customer') {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: data || [],
    });
  }

  if (profile?.role === 'photographer') {
    const { data: photographer, error: photographerError } =
      await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (photographerError) {
      return NextResponse.json(
        { error: photographerError.message },
        { status: 500 }
      );
    }

    if (!photographer) {
      return NextResponse.json({
        bookings: [],
      });
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('photographer_id', photographer.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: data || [],
    });
  }

  return NextResponse.json({
    bookings: [],
  });
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  if (profile?.role !== 'photographer') {
    return NextResponse.json(
      { error: 'Only photographers can update booking status.' },
      { status: 403 }
    );
  }

  const body = await request.json();

  const { booking_id, status } = body;

  if (!booking_id || !status) {
    return NextResponse.json(
      { error: 'booking_id and status are required.' },
      { status: 400 }
    );
  }

  if (
    !['accepted', 'declined', 'completed'].includes(status)
  ) {
    return NextResponse.json(
      { error: 'Invalid status value.' },
      { status: 400 }
    );
  }

  const { data: photographer, error: photographerError } =
    await supabase
      .from('photographers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

  if (photographerError) {
    return NextResponse.json(
      { error: photographerError.message },
      { status: 500 }
    );
  }

  if (!photographer) {
    return NextResponse.json(
      { error: 'Photographer profile not found.' },
      { status: 404 }
    );
  }

  const allowedCurrentStatuses =
    status === 'completed'
      ? ['accepted']
      : ['pending'];

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', booking_id)
    .eq('photographer_id', photographer.id)
    .in('status', allowedCurrentStatuses)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json(
      { error: bookingError.message },
      { status: 500 }
    );
  }

  if (!booking) {
    return NextResponse.json(
      {
        error:
          'Booking not found or this status change is not allowed.',
      },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', booking_id)
    .eq('photographer_id', photographer.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    booking: data,
  });
    }
