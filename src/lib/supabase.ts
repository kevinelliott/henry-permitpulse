import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient(url, anon);
  }
  return _client;
}

export function createServiceClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || anon);
}

// Types
export interface Profile {
  id: string;
  business_name: string | null;
  industry: string | null;
  state_code: string | null;
  city: string | null;
  slug: string | null;
  plan: 'free' | 'pro' | 'business';
  phone: string | null;
  website: string | null;
  address: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

export interface Permit {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  category: string | null;
  issuing_agency: string | null;
  agency_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'pending' | 'revoked' | 'one_time';
  renewal_cost: number | null;
  penalty_amount: number | null;
  notes: string | null;
  permit_number: string | null;
  filing_type: string | null;
  required_docs: string[] | null;
  tips: string | null;
  is_one_time: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  created_at: string;
}

export interface Certification {
  id: string;
  employee_id: string;
  user_id: string;
  cert_type: string;
  issue_date: string | null;
  expiry_date: string | null;
  upload_token: string;
  file_url: string | null;
  file_name: string | null;
  status: 'pending' | 'uploaded' | 'verified' | 'expired';
  created_at: string;
}

export interface PermitTemplate {
  id: string;
  industry: string;
  state_code: string;
  permit_name: string;
  category: string | null;
  typical_renewal_cycle: string | null;
  typical_cost_min: number | null;
  typical_cost_max: number | null;
  penalty_range_min: number | null;
  penalty_range_max: number | null;
  agency_name: string | null;
  agency_url: string | null;
  filing_type: string | null;
  required_docs: string[] | null;
  tips: string | null;
  is_one_time: boolean;
  sort_order: number;
}

// Helpers
export function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function getStatusFromDays(days: number, isOneTime: boolean): { label: string; color: string; bg: string; emoji: string } {
  if (isOneTime) return { label: 'One-Time', color: 'text-blue-400', bg: 'bg-blue-900/20', emoji: '🔵' };
  if (days < 0) return { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-900/20', emoji: '🔴' };
  if (days < 30) return { label: 'Warning', color: 'text-orange-400', bg: 'bg-orange-900/20', emoji: '🟠' };
  if (days < 90) return { label: 'Upcoming', color: 'text-amber-400', bg: 'bg-amber-900/20', emoji: '🟡' };
  return { label: 'Current', color: 'text-emerald-400', bg: 'bg-emerald-900/20', emoji: '✅' };
}

export function formatCurrency(amount: number | null): string {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export const INDUSTRIES = [
  { value: 'restaurant', label: 'Restaurant / Food Service', icon: '🍽️' },
  { value: 'contractor', label: 'General Contractor', icon: '🔨' },
  { value: 'salon', label: 'Hair Salon / Barbershop', icon: '✂️' },
  { value: 'retail', label: 'Retail Store', icon: '🛍️' },
  { value: 'auto_repair', label: 'Auto Repair Shop', icon: '🔧' },
  { value: 'fitness', label: 'Fitness Studio / Gym', icon: '💪' },
  { value: 'medical', label: 'Medical Practice', icon: '🏥' },
  { value: 'realestate', label: 'Real Estate Agency', icon: '🏠' },
];

export const STATES = [
  { value: 'CA', label: 'California' },
  { value: 'TX', label: 'Texas' },
  { value: 'FL', label: 'Florida' },
  { value: 'NY', label: 'New York' },
  { value: 'IL', label: 'Illinois' },
  { value: 'WA', label: 'Washington' },
  { value: 'GA', label: 'Georgia' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'CO', label: 'Colorado' },
  { value: 'OH', label: 'Ohio' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'NC', label: 'North Carolina' },
];
