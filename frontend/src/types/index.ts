export interface User {
  username: string;
  role: 'ADMIN' | 'TRAFFIC_OFFICER' | 'ANALYST' | 'PAYMENT_OPERATOR';
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface DashboardSummary {
  total_vehicles: number;
  total_drivers: number;
  total_violations: number;
  total_fines_levied: number;
  total_fines_collected: number;
  unpaid_fines_count: number;
  active_cameras: number;
  top_violation_zone: string;
  violations_today?: number;
  violations_yesterday?: number;
  pending_fines_amount?: number;
}

export interface ViolationTrend {
  date: string;
  violations: number;
  fines: number;
}

export interface AnalyticsZone {
  zone_code: string;
  zone_name: string;
  violations: number;
  revenue: number;
}

export interface AnalyticsType {
  type: string;
  count: number;
}

export interface AnalyticsCollection {
  total_levied: number;
  total_collected: number;
  collection_rate: string;
}

export interface AnalyticsRepeatOffender {
  registration_no: string;
  owner_name: string;
  violation_count: number;
  risk_score: number;
}

export interface Owner {
  owner_id: number;
  national_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  owner_type: string;
  created_at: string;
}

export interface Vehicle {
  vehicle_id: number;
  registration_no: string;
  owner_id: number;
  vehicle_class: string;
  make: string;
  model: string;
  fuel_type: string;
  mfg_year: number;
  reg_date: string;
  status: string;
}

export interface Driver {
  driver_id: number;
  owner_id?: number;
  full_name: string;
  dob: string;
  blood_group?: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface License {
  license_id: number;
  license_number: string;
  driver_id: number;
  category: string;
  issue_date: string;
  expiry_date: string;
  demerit_points: number;
  status: string;
}

export interface City {
  city_id: number;
  city_name: string;
  state_name: string;
  country: string;
  created_at: string;
}

export interface TrafficZone {
  zone_id: number;
  zone_code: string;
  zone_name: string;
  city_id: number;
  risk_level: string;
  created_at: string;
}

export interface Road {
  road_id: number;
  road_name: string;
  road_type: string;
  speed_limit_kmh: number;
  zone_id: number;
  created_at: string;
}

export interface Camera {
  camera_id: number;
  camera_code: string;
  camera_type: string;
  segment_id: number;
  direction?: string;
  status: string;
  ip_address?: string;
  installation_dt: string;
}

export interface VehicleEvent {
  event_id: number;
  camera_id: number;
  vehicle_id?: number;
  license_plate_raw?: string;
  event_timestamp: string;
  observed_speed?: number;
  ai_confidence?: number;
  event_status: string;
  mongo_doc_id?: string;
}

export interface Violation {
  violation_id: number;
  event_id?: number;
  vehicle_id: number;
  driver_id?: number;
  type_id: number;
  camera_id: number;
  officer_id?: number;
  violation_dt: string;
  status: string;
  remarks?: string;
  vehicle_reg_no?: string;
  type_title?: string;
  camera_code?: string;
  zone_name?: string;
  fine_amount?: number;
  payment_status?: string;
}

export interface Fine {
  fine_id: number;
  violation_id: number;
  base_amount: number;
  penalty_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
  status: string;
}

export interface Payment {
  payment_id: number;
  fine_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  txn_ref_no: string;
  status: string;
}

export interface Appeal {
  appeal_id: number;
  violation_id: number;
  appellant_id: number;
  appeal_date: string;
  reason: string;
  status: string;
}

export interface Officer {
  officer_id: number;
  badge_number: string;
  full_name: string;
  rank_title: string;
  zone_id?: number;
  phone?: string;
  email?: string;
  status: string;
}

export interface Evidence {
  _id?: string;
  evidence_id?: string;
  event_id: number;
  camera_code: string;
  image_url: string;
  bounding_box?: { x: number; y: number; w: number; h: number };
  confidence_score: number;
  timestamp: string;
  source?: string;
}

export interface SearchResult {
  source: string;
  total: number;
  results: any[];
}

export interface SystemHealth {
  status: string;
  system?: string;
  database?: string;
  engine?: string;
  mode?: string;
  format?: string;
  file?: string;
  schema?: string;
  details?: string;
}

export interface SystemDependenciesHealth {
  core_api: SystemHealth;
  database: SystemHealth;
  mongodb: SystemHealth;
  elasticsearch: SystemHealth;
  warehouse: SystemHealth;
  parquet: SystemHealth;
  hadoop: SystemHealth;
}
