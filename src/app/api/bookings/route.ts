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

  const { searchParams } = new URL(request.url);
  const photographerId = searchParams.get('photographer_id');

  // Used by the booking form to check unavailable dates
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
      bookedDates: (data || []).map((booking) => booking.event_date),
    });
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

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

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

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: data });
  }

  return NextResponse.json(
    { error: 'Unauthorized role.' },
    { status: 403 }
  );
}
