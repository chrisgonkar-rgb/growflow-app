// Growflow Backend Types
// © TrueNorth Group of Companies Ltd.

export type UserRole = 'admin' | 'staff' | 'collector';

export type CustomerStatus = 
  | 'pending_quote' 
  | 'active_payment_required' 
  | 'payment_pending_verification' 
  | 'active_paid' 
  | 'suspended';

export type WasteType = 'household' | 'mixed' | 'business' | 'construction';

export type Frequency = 'weekly' | 'twice_weekly' | 'special';

export type PaymentMethod = 'cash' | 'mobile_money';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export type Currency = 'USD' | 'LRD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  created_at: Date;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  password_hash: string;
  city: string;
  community: string;
  landmark: string;
  waste_type: WasteType;
  frequency: Frequency;
  status: CustomerStatus;
  created_at: Date;
  reset_token?: string;
  reset_token_expires?: Date;
}

export interface Subscription {
  id: string;
  customer_id: string;
  agreed_amount_usd: number;
  agreed_amount_lrd?: number;
  start_date: string;
  set_by: string;
  set_at: Date;
  notes?: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  subscription_id: string;
  payment_month: number;
  payment_year: number;
  paid_currency: Currency;
  paid_amount: number;
  method: PaymentMethod;
  reference?: string;
  proof_url?: string;
  status: PaymentStatus;
  submitted_at: Date;
  verified_at?: Date;
  verified_by?: string;
  rejection_reason?: string;
}

// Request/Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'staff' | 'customer';
}
