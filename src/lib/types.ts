// =============================================================================
// TUTBOT — Shared API types
// -----------------------------------------------------------------------------
// This file is the canonical contract between frontend and backend.
// Keep snake_case for fields that come straight from the API; the api wrapper
// (lib/api.ts) does NOT auto-transform — be explicit so backend devs can
// match these shapes 1:1.
// =============================================================================

export type LandmarkCategory =
'Archaeological' |
'Museum' |
'Religious' |
'Recreational' |
'Cultural';

export interface Landmark {
  id: string;
  name: string;
  region: string;
  city?: string | null;
  area?: string | null;
  category: LandmarkCategory;
  raw_category?: string;
  era?: string | null;
  description?: string | null;
  image: string;
  fallback_image?: string | null;
  panorama_url?: string | null;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  price: number;
  opening_hours?: string | null;
  closing_hours?: string | null;
  avg_visit_duration?: number | null;
  accessibility_wheelchair?: boolean;
  is_outdoor?: boolean;
  best_day_visit?: string | null;
  best_season?: string | null;
  cost_level?: string | null;
  entrance_fee_egyptian?: number;
  entrance_fee_egyptian_student?: number;
  entrance_fee_foreigner?: number;
  entrance_fee_foreigner_student?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  level: number;
  xp: number;
  next_level_xp: number;
  location?: string | null;
  bio?: string | null;
  badges: Badge[];
  is_admin?: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Review {
  id: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  rating: number;
  text: string;
  created_at: string;
}

export type PaymentMethod = 'card' | 'mobile' | 'qr' | 'cash';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  confirmation_code: string;
  status: BookingStatus;
  landmark: Landmark;
  booking_date: string; // YYYY-MM-DD
  adults: number;
  children: number;
  subtotal: number;
  service_fee: number;
  total: number;
  currency: 'EGP';
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  qr_token: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  traveler: {
    id: string;
    name: string;
    avatar?: string | null;
    level: number;
    badges_count: number;
  };
  landmark?: Pick<Landmark, 'id' | 'name'> | null;
  location: string;
  category: LandmarkCategory | 'General';
  image?: string | null;
  video_url?: string | null;
  excerpt: string;
  likes: number;
  comments_count: number;
  liked_by_me: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  user: Pick<User, 'id' | 'name' | 'avatar'> | null;
  is_ai: boolean;
  text: string;
  parent_id: string | null;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// =============================================================================
// AI
// =============================================================================

export type AiRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AiMessage {
  role: AiRole;
  content: string;
  suggestions?: AiSuggestion[];
  source?: 'llm' | 'fallback' | 'canned';
}

export type AiSuggestion =
{type: 'landmark';id: string;name: string;} |
{type: 'action';id: string;landmark_id?: string;label?: string;};

export interface AiChatRequest {
  conversation_id?: string | null;
  messages: AiMessage[];
  context?: {
    current_landmark_id?: string | null;
    user_preferences?: Record<string, unknown>;
  };
}

export interface AiChatResponse {
  conversation_id: string;
  message: AiMessage;
}

export interface QuickAction {
  key: string;
  label: string;
  prompt: string;
}

// =============================================================================
// Error envelope
// =============================================================================
export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}