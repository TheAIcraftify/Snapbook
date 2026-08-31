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

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay is not configured.' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(
      `${keyId}:${keySecret}`
    ).toString('base64');

    const orderResponse = await fetch(
      'https://api.razorpay.com/v1/orders',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(tipAmount * 100),
          currency: 'INR',
          receipt: `tip_${booking_id}_${Date.now()}`,
          notes: {
            booking_id,
            customer_id: profile.id,
            photographer_id,
          },
        }),
      }
    );

    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      return NextResponse.json(
        {
          error:
            order?.error?.description ||
            'Unable to create Razorpay order.',
        },
        { status: 400 }
      );
    }

    const { data: tip, error: tipError } = await supabase
      .from('tips')
      .insert({
        booking_id,
        photographer_id,
        customer_id: profile.id,
        amount: tipAmount,
        status: 'pending',
        razorpay_order_id: order.id,
      })
      .select()
      .single();

    if (tipError) {
      return NextResponse.json(
        { error: tipError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        tip,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
        key_id: keyId,
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
