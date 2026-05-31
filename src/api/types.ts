export interface PG {
  id: string;
  name: string;
  address: string | null;
  whatsapp_message_template: string;
  activation_code?: string;
  created_at: string;
  is_active?: boolean;
  subscription_status?: 'active' | 'warning' | 'suspended';
  monthly_price?: number;
  subscription_start?: string;
  subscription_end?: string;
  subscription_notes?: string;
}

export interface AdminRevenuePG {
  pg_name: string;
  monthly_price: number;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  is_active: boolean;
}

export interface AdminRevenueResponse {
  total_monthly_revenue: number;
  active_pg_count: number;
  suspended_pg_count: number;
  warning_pg_count: number;
  pgs: AdminRevenuePG[];
}

export interface User {
  id: string;
  email: string;
  role: string;
  pg_id: string | null;
}

export interface PGCreate {
  name: string;
  address?: string;
}

export interface PGUpdate {
  name?: string;
  address?: string;
  whatsapp_message_template?: string;
}

export interface Room {
  id: string;
  pg_id: string;
  room_number: string;
  total_beds: number;
}

export interface RoomCreate {
  pg_id?: string;
  room_number: string;
  total_beds: number;
}

export interface RoomUpdate {
  room_number?: string;
  total_beds?: number;
}

export interface BulkRoomCreate {
  floors: number;
  rooms_per_floor: number;
  beds_per_room: number;
  starting_number?: number;
}

export interface BulkRoomResult {
  rooms_created: number;
  beds_created: number;
  skipped_duplicates: string[];
}

export interface BedCreate {
  room_id: string;
  bed_label?: string;
}

export interface Bed {
  id: string;
  room_id: string;
  bed_label: string | null;
  is_occupied: boolean;
  created_at?: string;
}


export interface Tenant {
  id: string;
  name: string;
  phone: string;
  rent_amount: number;
  bed_id: string | null;
  move_in_date: string;
  rent_status: "paid" | "unpaid";
  last_paid_date: string | null;
  created_at: string;
  
  aadhaar_last4?: string | null;
  pan_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  employer_or_college?: string | null;
  hometown?: string | null;
  food_preference?: "veg" | "non_veg" | "both";
  vehicle_registration?: string | null;
  security_deposit_amount?: number | null;
  security_deposit_date?: string | null;
  expected_move_out_date?: string | null;
  police_verification_done?: boolean;
  police_verification_date?: string | null;
  occupancy_type?: "single" | "double" | "triple";

  // Move-out and archive fields
  is_active?: boolean;
  notice_given_date?: string | null;
  actual_move_out_date?: string | null;
  deposit_returned_amount?: number | null;
  deposit_deduction_reason?: string | null;

  // Joined fields from TenantResponse
  room_number?: string | null;
  bed_label?: string | null;
}

export interface TenantCreate {
  name: string;
  phone: string;
  rent_amount: number;
  bed_id: string;
  move_in_date: string;
  rent_status?: "paid" | "unpaid";

  aadhaar_last4?: string;
  pan_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  employer_or_college?: string;
  hometown?: string;
  food_preference?: "veg" | "non_veg" | "both";
  vehicle_registration?: string;
  security_deposit_amount?: number;
  security_deposit_date?: string;
  expected_move_out_date?: string;
  police_verification_done?: boolean;
  police_verification_date?: string;
  occupancy_type?: "single" | "double" | "triple";
}

export interface TenantUpdate {
  name?: string;
  phone?: string;
  rent_amount?: number;
  move_in_date?: string;

  aadhaar_last4?: string | null;
  pan_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  employer_or_college?: string | null;
  hometown?: string | null;
  food_preference?: "veg" | "non_veg" | "both" | null;
  vehicle_registration?: string | null;
  security_deposit_amount?: number | null;
  security_deposit_date?: string | null;
  expected_move_out_date?: string | null;
  police_verification_done?: boolean | null;
  police_verification_date?: string | null;
  occupancy_type?: "single" | "double" | "triple" | null;
}

export interface DashboardStats {
  pg_name: string;
  total_beds: number;
  occupied_beds: number;
  empty_beds: number;
  pending_payments: number;
  total_rent_collected: number;
  total_rent_expected: number;
  vacancy_rate: number;
  beds_vacant_gt30_days: number;
}

export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  id: string;
  tenant_name?: string;
  room_number?: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface MaintenanceCreate {
  tenant_id: string;
  title: string;
  description: string;
}

export interface ApiError {
  status: number;
  message: string;
}
