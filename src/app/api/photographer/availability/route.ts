import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const searchParams = new URL(request.url).searchParams;
  const photographerId = searchParams.get('photographer_id');

  // Customer/public booking flow:
  // Return only unavailable dates for the selected photographer.
  if (photographerId) {
    const { data: photographer, error: photographerError } =
      await supabase
        .from('photographers')
        .select('user_id')
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
        { error: 'Photographer not found.' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('photographer_availability')
      .select('available_date')
      .eq('photographer_id', photographer.user_id)
      .eq('is_available', false);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      unavailableDates: (data || []).map(
        (item) => item.available_date
      ),
    });
  }

  // Photographer management flow:
  // Return only the authenticated photographer's records.
  const { data: photographer, error: photographerError } =
    await supabase
      .from('photographers')
      .select('user_id')
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
      { error: 'Only photographers can view availability.' },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('photographer_availability')
    .select('*')
    .eq('photographer_id', photographer.user_id)
    .order('available_date', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    availability: data || [],
  });
}

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

  const { data: photographer, error: photographerError } =
    await supabase
      .from('photographers')
      .select('user_id')
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
      { error: 'Only photographers can manage availability.' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { available_date, is_available } = body;

  if (!available_date || typeof is_available !== 'boolean') {
    return NextResponse.json(
      { error: 'Missing or invalid fields.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('photographer_availability')
    .upsert(
      {
        photographer_id: photographer.user_id,
        available_date,
        is_available,
      },
      {
        onConflict: 'photographer_id,available_date',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ availability: data });
}
