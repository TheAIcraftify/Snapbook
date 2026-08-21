import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const category = searchParams.get('category');

  let query = supabase
    .from('photographers')
    .select('id, user_id, city, categories, price_range, rating, portfolio_urls, bio')
    .eq('verification_status', 'verified');

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  if (category) {
    query = query.contains('categories', [category]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photographers: data });
}
