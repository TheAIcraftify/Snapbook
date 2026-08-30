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

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

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
        photographer_id: photographer.id,
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
