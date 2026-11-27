import { apiRequest } from './client';
import type {
  AuditorDashboardResponse,
  LoadPalletPayload,
  OccupancySummary,
  Pallet,
  ShuttleInfo,
  User,
  UserRole,
  WarehouseStateResponse,
} from '../types/warehouse';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export function loginRequest(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ username, password }),
  });
}

export function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>('/api/auth/me/');
}

export function fetchWarehouseState(): Promise<WarehouseStateResponse> {
  return apiRequest<WarehouseStateResponse>('/api/warehouse/state/');
}

export function loadPallet(payload: LoadPalletPayload): Promise<{
  message: string;
  pallet: Pallet;
  summary: OccupancySummary;
}> {
  return apiRequest('/api/warehouse/load/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function unloadPallet(locationCode: string): Promise<{
  message: string;
  summary: OccupancySummary;
}> {
  return apiRequest('/api/warehouse/unload/', {
    method: 'POST',
    body: JSON.stringify({ location_code: locationCode }),
  });
}

export function fetchShuttleStatus(): Promise<ShuttleInfo> {
  return apiRequest<ShuttleInfo>('/api/shuttle/');
}

export function fetchAuditorDashboard(): Promise<AuditorDashboardResponse> {
  return apiRequest<AuditorDashboardResponse>('/api/auditor/dashboard/');
}

export function fetchUsers(): Promise<User[]> {
  return apiRequest<User[]>('/api/users/');
}

export function createUser(payload: {
  username: string;
  password: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  email?: string;
}): Promise<User> {
  return apiRequest<User>('/api/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(
  userId: number,
  payload: Partial<Pick<User, 'role' | 'is_active' | 'first_name' | 'last_name' | 'email'>>,
): Promise<User> {
  return apiRequest<User>(`/api/users/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function resetUserPassword(userId: number, password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/users/${userId}/reset-password/`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function deleteUser(userId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/users/${userId}/`, {
    method: 'DELETE',
  });
}
