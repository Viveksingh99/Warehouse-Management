export type UserRole = 'admin' | 'auditor' | 'technician';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  date_joined?: string;
  last_login?: string | null;
}

export interface Pallet {
  id: number;
  pallet_number: string;
  barcode: string;
  item_name: string;
  quantity: number;
  location_code: string;
  status: 'STORED' | 'UNLOADED';
  loaded_by: string;
  loaded_at: string;
}

export type CellState = 'TRANSFER' | 'FREE' | 'OCCUPIED';

export interface WarehouseLocation {
  code: string;
  col: string;
  row: number;
  is_transfer_point: boolean;
  state: CellState;
  pallet: Pallet | null;
}

export interface OccupancySummary {
  total_storage_locations: number;
  occupied_count: number;
  free_count: number;
  occupancy_rate: number;
}

export interface ShuttleInfo {
  identifier: string;
  status: 'IDLE' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  battery_percentage: number;
  current_location: string;
  updated_at: string;
  total_movements?: number;
}

export interface WarehouseStateResponse {
  locations: WarehouseLocation[];
  summary: OccupancySummary;
  shuttle: ShuttleInfo | null;
  server_time: string;
}

export interface DailyHistoryPoint {
  date: string;
  label: string;
  occupied_count: number;
  free_count: number;
  total_capacity: number;
  loads_count: number;
  unloads_count: number;
  is_live: boolean;
}

export interface MovementLogEntry {
  id: number;
  action: 'LOAD' | 'UNLOAD';
  pallet_number: string;
  barcode: string;
  item_name: string;
  quantity: number;
  location_code: string;
  performed_by: string;
  timestamp: string;
}

export interface AuditorDashboardResponse {
  summary: OccupancySummary;
  history_7_days: DailyHistoryPoint[];
  pallets: Pallet[];
  recent_movements: MovementLogEntry[];
  server_time: string;
}

export interface LoadPalletPayload {
  pallet_number: string;
  barcode: string;
  item_name: string;
  quantity: number;
  location_code: string;
}
