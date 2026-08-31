import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Get the currently logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to leave a review.' },
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

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify that this booking belongs to the logged-in customer,
    // belongs to the selected photographer, and was accepted.
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, photographer_id, status')
      .eq('id', booking_id)
      .eq('customer_id', user.id)
      .eq('photographer_id', photographer_id)
      .eq('status', 'accepted')
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
            'You can only review a photographer after your booking has been accepted.',
        },
        { status: 403 }
      );
    }

    // Prevent more than one review for the same booking.
    const { data: existingReview, error: existingReviewError } =
      await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking.id)
        .maybeSingle();

    if (existingReviewError) {
      return NextResponse.json(
        { error: existingReviewError.message },
        { status: 500 }
      );
    }

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking.' },
        { status: 409 }
      );
    }

    const cleanReview =
      typeof review === 'string' ? review.trim() : '';

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        photographer_id: booking.photographer_id,
        rating: numericRating,
        review: cleanReview,
      })
      .select('id, photographer_id, rating, review, created_at')
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
