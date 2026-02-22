// Growflow - GreenFlow Customer Management Types
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
  created_at: string;
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
  created_at: string;
  reset_token?: string;
  reset_token_expires?: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  agreed_amount_usd: number;
  agreed_amount_lrd?: number;
  start_date: string;
  set_by: string;
  set_at: string;
  notes?: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  subscription_id: string;
  payment_month: number; // 1-12
  payment_year: number;
  paid_currency: Currency;
  paid_amount: number;
  method: PaymentMethod;
  reference?: string;
  proof_url?: string;
  status: PaymentStatus;
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
}

export interface CustomerWithSubscription extends Customer {
  subscription?: Subscription;
  payments?: Payment[];
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export interface DashboardMetrics {
  total_active_customers: number;
  total_paid_this_month: number;
  pending_payments: number;
  revenue_usd: number;
  revenue_lrd: number;
}

export interface MonthlyPaymentStatus {
  month: number;
  year: number;
  monthName: string;
  status: 'unpaid' | 'pending' | 'paid' | 'rejected';
  payment?: Payment;
}

// Cities in Liberia
export const LIBERIA_CITIES = [
  'Paynesville',
  'Gardnersville',
  'Congo Town',
  'Old Road',
  'Sinkor',
  'Monrovia',
  'Johnsonville',
  'Brewerville',
  'RIA Highway',
] as const;

// Waste types
export const WASTE_TYPES: { value: WasteType; label: string }[] = [
  { value: 'household', label: 'Household' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'business', label: 'Business' },
  { value: 'construction', label: 'Construction' },
];

// Frequencies
export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice_weekly', label: 'Twice Weekly' },
  { value: 'special', label: 'Special' },
];

// Payment methods
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

// Months for payment selection
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// Generate year options (current year +/- 1)
export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
}
