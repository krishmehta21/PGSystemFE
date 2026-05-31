import * as client from "./client";
import type {
  DashboardStats,
  Room,
  RoomCreate,
  RoomUpdate,
  BulkRoomCreate,
  BulkRoomResult,
  Bed,
  BedCreate,
  Tenant,
  TenantCreate,
  TenantUpdate,
  PGCreate,
  PGUpdate,
  PG,
  User,
} from "./types";

export const getMe = () => client.get<User>("/api/v1/auth/me");

export const getDashboard = () =>
  client.get<DashboardStats>("/api/v1/dashboard");

// ── Rooms ───────────────────────────────────────────────────────────────────
export const getRooms  = () => client.get<Room[]>("/api/v1/rooms/");
export const createRoom = (data: RoomCreate) => client.post<Room>("/api/v1/rooms/", data);
export const updateRoom = (id: string, data: RoomUpdate) => client.put<Room>(`/api/v1/rooms/${id}`, data);
export const deleteRoom = (id: string, force = false) =>
  client.delete<void>(`/api/v1/rooms/${id}${force ? '?force=true' : ''}`);
export const bulkCreateRooms = (data: BulkRoomCreate) =>
  client.post<BulkRoomResult>("/api/v1/rooms/bulk", data);
export const bulkDeleteRooms = (roomIds: string[], force = false) =>
  client.post<void>("/api/v1/rooms/bulk-delete", { room_ids: roomIds, force });

// ── Beds ─────────────────────────────────────────────────────────────────────
export const getBeds   = (roomId?: string) => client.get<Bed[]>(roomId ? `/api/v1/beds?room_id=${roomId}` : '/api/v1/beds');
export const createBed = (data: BedCreate) => client.post<Bed>("/api/v1/beds/", data);
export const deleteBed = (id: string) => client.delete<void>(`/api/v1/beds/${id}`);


export const getTenants = () => client.get<Tenant[]>("/api/v1/tenants/");

export const getTenant = (id: string) =>
  client.get<Tenant>(`/api/v1/tenants/${id}`);

export const createTenant = (data: TenantCreate) =>
  client.post<Tenant>("/api/v1/tenants/", data);

export const updateTenant = (id: string, data: TenantUpdate) =>
  client.put<Tenant>(`/api/v1/tenants/${id}`, data);

export const deleteTenant = (id: string) =>
  client.delete<void>(`/api/v1/tenants/${id}`);

export const toggleRentStatus = (tenantId: string, status: "paid" | "unpaid") =>
  client.patch<Tenant>(`/api/v1/tenants/${tenantId}/rent`, { status });

export const getUnpaidTenants = () =>
  client.get<Tenant[]>("/api/v1/tenants/unpaid");

export const settleMoveOut = (
  tenantId: string,
  data: {
    notice_given_date: string;
    actual_move_out_date: string;
    deposit_returned_amount: number;
    deposit_deduction_reason?: string;
  }
) => client.post<any>(`/api/v1/tenants/${tenantId}/move-out`, data);



export const getMyPG = () => client.get<PG>("/api/v1/pgs/me");

interface ActivateRequest {
  activation_code: string;
}
export const activatePG = (data: ActivateRequest) => client.post<PG>("/api/v1/auth/activate", data);

export const getAdminPGs = () => client.get<PG[]>("/api/v1/pgs");

export const createPG = (data: PGCreate) => client.post<PG>("/api/v1/pgs", data);

export const updatePG = (id: string, data: PGUpdate) => client.put<PG>(`/api/v1/pgs/${id}`, data);

export const updatePGSubscription = (id: string, data: { 
  is_active?: boolean, 
  subscription_status?: "active" | "warning" | "suspended",
  monthly_price?: number,
  subscription_start?: string,
  subscription_end?: string,
  subscription_notes?: string
}) => client.patch<PG>(`/api/v1/pgs/${id}/subscription`, data);

import type { AdminRevenueResponse } from "./types";
export const getAdminRevenue = () => client.get<AdminRevenueResponse>("/api/v1/pgs/admin/revenue");

export const getDashboardForAdmin = (pgId: string) => client.get<DashboardStats>(`/api/v1/dashboard?pg_id=${pgId}`);

// ── Documents ─────────────────────────────────────────────────────────────
export interface TenantDocument {
  name: string;
  size: number;
  created_at: string;
  url: string;
}

export const getDocuments = (tenantId: string) =>
  client.get<TenantDocument[]>(`/api/v1/tenants/${tenantId}/documents`);

export const uploadDocument = (tenantId: string, formData: FormData) =>
  client.post<{ message: string; filename: string }>(`/api/v1/tenants/${tenantId}/documents`, formData);

export const deleteDocument = (tenantId: string, filename: string) =>
  client.delete<{ message: string }>(`/api/v1/tenants/${tenantId}/documents/${filename}`);

// ── Maintenance ─────────────────────────────────────────────────────────────
import type { MaintenanceRequest, MaintenanceCreate } from './types';

export const getMaintenanceRequests = () =>
  client.get<MaintenanceRequest[]>("/api/v1/maintenance");

export const createMaintenanceRequest = (data: MaintenanceCreate) =>
  client.post<MaintenanceRequest>("/api/v1/maintenance", data);

export const updateMaintenanceStatus = (id: string, status: "open" | "in_progress" | "resolved") =>
  client.patch<MaintenanceRequest>(`/api/v1/maintenance/${id}`, { status });

// ── Reminders ───────────────────────────────────────────────────────────────
export const dispatchReminder = (tenantId: string, whatsappLink: string) =>
  client.post<{ message: string }>("/api/v1/reminders/dispatch", {
    tenant_id: tenantId,
    whatsapp_link: whatsappLink
  });

// ── Document Parsing ────────────────────────────────────────────────────────
export interface ParseAadhaarResponse {
  name?: string;
  masked_aadhaar?: string;
  dob?: string;
  gender?: string;
  address?: string;
}

export const parseAadhaar = (formData: FormData, roomNumber?: string) =>
  client.post<ParseAadhaarResponse>(`/api/v1/tenants/parse-aadhaar${roomNumber ? `?room_number=${encodeURIComponent(roomNumber)}` : ''}`, formData);
