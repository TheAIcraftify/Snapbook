import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a review.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      booking_id,
      photographer_id,
      rating,
      review,
    } = body;

    if (!booking_id || !photographer_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, photographer_id, status')
      .eq('id', booking_id)
      .eq('customer_id', user.id)
      .eq('photographer_id', photographer_id)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or does not belong to you.' },
        { status: 403 }
      );
    }

    if (booking.status !== 'accepted') {
      return NextResponse.json(
        { error: 'You can review a photographer only after the booking is accepted.' },
        { status: 403 }
      );
    }

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        customer_id: user.id,
        photographer_id,
        rating,
        review: review || '',
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
      { success: true, review: data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 500 }
    );
  }
}
