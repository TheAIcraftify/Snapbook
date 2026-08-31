import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    if (profile.role !== 'customer') {
      return NextResponse.json(
        { error: 'Only customers can send tips.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      booking_id,
      photographer_id,
      amount,
    } = body;

    if (!booking_id || !photographer_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const tipAmount = Number(amount);

    if (!Number.isFinite(tipAmount) || tipAmount < 1) {
      return NextResponse.json(
        { error: 'Tip amount must be at least ₹1.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: booking, error: bookingError } =
      await supabase
        .from('bookings')
        .select('id, customer_id, photographer_id, status')
        .eq('id', booking_id)
        .maybeSingle();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 400 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      );
    }

    if (booking.customer_id !== profile.id) {
      return NextResponse.json(
        { error: 'You cannot tip for this booking.' },
        { status: 403 }
      );
    }

    if (booking.photographer_id !== photographer_id) {
      return NextResponse.json(
        { error: 'Invalid photographer for this booking.' },
        { status: 400 }
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Tips are available after the booking is completed.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tips')
      .insert({
        booking_id,
        photographer_id,
        customer_id: profile.id,
        amount: tipAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        tip: data,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 500 }
    );
  }
}
