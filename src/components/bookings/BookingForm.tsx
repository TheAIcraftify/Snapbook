import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const photographerId = searchParams.get('photographer_id');

    if (!photographerId) {
      return NextResponse.json(
        { error: 'photographer_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: photographer, error: photographerError } =
      await supabase
        .from('photographers')
        .select('id')
        .eq('id', photographerId)
        .maybeSingle();

    if (photographerError) {
      return NextResponse.json(
        { error: photographerError.message },
        { status: 500 }
      );
    }

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      );
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('event_date, status')
      .eq('photographer_id', photographerId)
      .in('status', ['pending', 'accepted']);

    if (bookingsError) {
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    const unavailableDates = (bookings || [])
      .map((booking) => booking.event_date)
      .filter(Boolean);

    return NextResponse.json({
      unavailableDates,
    });
  } catch (error) {
    console.error('Availability API error:', error);

    return NextResponse.json(
      { error: 'Unable to load photographer availability' },
      { status: 500 }
    );
  }
}
