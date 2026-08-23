export type UserRole = 'customer' | 'photographer' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Photographer {
  id: string;
  user_id: string;
  phone?: string;
  email?: string;
  instagram?: string;
  portfolio_urls: string[];
  bio: string;
  categories: string[];
  city: string;
  price_range: string;
  verification_status: VerificationStatus;
  rating: number;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  photographer_id: string;
  event_date: string;
  event_type: string;
  location: string;
  message: string;
  status: BookingStatus;
  created_at: string;
}
