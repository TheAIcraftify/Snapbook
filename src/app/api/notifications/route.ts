import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(
        'id, type, title, message, booking_id, is_read, created_at'
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      notifications: notifications || [],
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load notifications.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json(
        { error: 'Notification ID is required.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', profile.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: data,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to update notification.' },
      { status: 500 }
    );
  }
}
