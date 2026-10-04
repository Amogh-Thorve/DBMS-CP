import { apiClient } from './client';
import type {
  DashboardSummary, AnalyticsZone, AnalyticsType, AnalyticsCollection, AnalyticsRepeatOffender,
  Vehicle, Owner, Driver, License, TrafficZone, Road, Camera, VehicleEvent,
  Violation, Fine, Payment, Appeal, Officer, Evidence, SearchResult, SystemHealth, TokenResponse, User
} from '../types';

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await apiClient.post<TokenResponse>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },
  getProfile: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  }
};

export const analyticsApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/analytics/dashboard-summary');
    return res.data;
  },
  getViolationsByZone: async (): Promise<AnalyticsZone[]> => {
    const res = await apiClient.get<AnalyticsZone[]>('/analytics/violations-by-zone');
    return res.data;
  },
  getViolationsByType: async (): Promise<AnalyticsType[]> => {
    const res = await apiClient.get<AnalyticsType[]>('/analytics/violations-by-type');
    return res.data;
  },
  getFineCollection: async (): Promise<AnalyticsCollection> => {
    const res = await apiClient.get<AnalyticsCollection>('/analytics/fine-collection');
    return res.data;
  },
  getRepeatOffenders: async (): Promise<AnalyticsRepeatOffender[]> => {
    const res = await apiClient.get<AnalyticsRepeatOffender[]>('/analytics/repeat-offenders');
    return res.data;
  }
};

export const zonesApi = {
  list: async (): Promise<TrafficZone[]> => {
    const res = await apiClient.get<TrafficZone[]>('/zones');
    return res.data;
  }
};

export const roadsApi = {
  list: async (): Promise<Road[]> => {
    const res = await apiClient.get<Road[]>('/roads');
    return res.data;
  }
};

export const vehiclesApi = {
  list: async (params?: { skip?: number; limit?: number; owner_id?: number; registration_no?: string; status?: string }): Promise<Vehicle[]> => {
    const res = await apiClient.get<Vehicle[]>('/vehicles', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Vehicle> => {
    const res = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return res.data;
  },
  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>('/vehicles', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await apiClient.put<Vehicle>(`/vehicles/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  }
};

export const ownersApi = {
  list: async (params?: { skip?: number; limit?: number; national_id?: string; email?: string }): Promise<Owner[]> => {
    const res = await apiClient.get<Owner[]>('/owners', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Owner> => {
    const res = await apiClient.get<Owner>(`/owners/${id}`);
    return res.data;
  },
  create: async (data: Partial<Owner>): Promise<Owner> => {
    const res = await apiClient.post<Owner>('/owners', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Owner>): Promise<Owner> => {
    const res = await apiClient.put<Owner>(`/owners/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/owners/${id}`);
  }
};

export const driversApi = {
  list: async (params?: { skip?: number; limit?: number; owner_id?: number }): Promise<Driver[]> => {
    const res = await apiClient.get<Driver[]>('/drivers', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Driver> => {
    const res = await apiClient.get<Driver>(`/drivers/${id}`);
    return res.data;
  },
  create: async (data: Partial<Driver>): Promise<Driver> => {
    const res = await apiClient.post<Driver>('/drivers', data);
    return res.data;
  }
};

export const licensesApi = {
  list: async (params?: { skip?: number; limit?: number; driver_id?: number }): Promise<License[]> => {
    const res = await apiClient.get<License[]>('/licenses', { params });
    return res.data;
  },
  create: async (data: Partial<License>): Promise<License> => {
    const res = await apiClient.post<License>('/licenses', data);
    return res.data;
  }
};

export const camerasApi = {
  list: async (params?: { skip?: number; limit?: number; status?: string }): Promise<Camera[]> => {
    const res = await apiClient.get<Camera[]>('/cameras', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Camera> => {
    const res = await apiClient.get<Camera>(`/cameras/${id}`);
    return res.data;
  },
  create: async (data: Partial<Camera>): Promise<Camera> => {
    const res = await apiClient.post<Camera>('/cameras', data);
    return res.data;
  }
};

export const eventsApi = {
  list: async (params?: { skip?: number; limit?: number; camera_id?: number; event_status?: string }): Promise<VehicleEvent[]> => {
    const res = await apiClient.get<VehicleEvent[]>('/vehicle-events', { params });
    return res.data;
  },
  getById: async (id: number): Promise<VehicleEvent> => {
    const res = await apiClient.get<VehicleEvent>(`/vehicle-events/${id}`);
    return res.data;
  },
  ingest: async (data: Partial<VehicleEvent>): Promise<VehicleEvent> => {
    const res = await apiClient.post<VehicleEvent>('/vehicle-events', data);
    return res.data;
  }
};

export const violationsApi = {
  list: async (params?: { skip?: number; limit?: number; vehicle_id?: number; camera_id?: number; status?: string }): Promise<Violation[]> => {
    const res = await apiClient.get<Violation[]>('/violations', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Violation> => {
    const res = await apiClient.get<Violation>(`/violations/${id}`);
    return res.data;
  },
  create: async (data: Partial<Violation>): Promise<Violation> => {
    const res = await apiClient.post<Violation>('/violations', data);
    return res.data;
  }
};

export const finesApi = {
  list: async (params?: { skip?: number; limit?: number; status?: string }): Promise<Fine[]> => {
    const res = await apiClient.get<Fine[]>('/fines', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Fine> => {
    const res = await apiClient.get<Fine>(`/fines/${id}`);
    return res.data;
  }
};

export const paymentsApi = {
  list: async (params?: { skip?: number; limit?: number; fine_id?: number; txn_ref_no?: string }): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/payments', { params });
    return res.data;
  },
  process: async (data: { fine_id: number; payment_amount: number; payment_method: string; txn_ref_no: string }): Promise<Payment> => {
    const res = await apiClient.post<Payment>('/payments', data);
    return res.data;
  }
};

export const appealsApi = {
  list: async (params?: { skip?: number; limit?: number; violation_id?: number; status?: string }): Promise<Appeal[]> => {
    const res = await apiClient.get<Appeal[]>('/appeals', { params });
    return res.data;
  },
  file: async (data: { violation_id: number; appellant_id: number; reason: string }): Promise<Appeal> => {
    const res = await apiClient.post<Appeal>('/appeals', data);
    return res.data;
  },
  review: async (id: number, data: { status: 'APPROVED' | 'REJECTED'; reviewer_remarks?: string }): Promise<Appeal> => {
    const res = await apiClient.put<Appeal>(`/appeals/${id}/review`, data);
    return res.data;
  }
};

export const officersApi = {
  list: async (params?: { skip?: number; limit?: number; zone_id?: number; status?: string }): Promise<Officer[]> => {
    const res = await apiClient.get<Officer[]>('/officers', { params });
    return res.data;
  },
  create: async (data: Partial<Officer>): Promise<Officer> => {
    const res = await apiClient.post<Officer>('/officers', data);
    return res.data;
  }
};

export const searchApi = {
  search: async (params: { q?: string; status?: string; registration_no?: string; min_speed?: number; max_speed?: number }): Promise<SearchResult> => {
    const res = await apiClient.get<SearchResult>('/search', { params });
    return res.data;
  }
};

export const evidenceApi = {
  getByEventId: async (eventId: number): Promise<Evidence> => {
    const res = await apiClient.get<Evidence>(`/evidence/${eventId}`);
    return res.data;
  },
  create: async (data: Partial<Evidence>): Promise<Evidence> => {
    const res = await apiClient.post<Evidence>('/evidence', data);
    return res.data;
  }
};

export const reportsApi = {
  triggerExport: async (): Promise<{ status: string; message: string }> => {
    const res = await apiClient.post<{ status: string; message: string }>('/reports/export-parquet');
    return res.data;
  },
  getStatus: async (): Promise<{ status: string; file?: string; size_bytes?: number; format?: string }> => {
    const res = await apiClient.get<{ status: string; file?: string; size_bytes?: number; format?: string }>('/reports/status');
    return res.data;
  }
};

export const healthApi = {
  getCore: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<SystemHealth>('/health');
    return res.data;
  },
  getDb: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<SystemHealth>('/health/db');
    return res.data;
  },
  getMongo: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<SystemHealth>('/health/mongodb');
    return res.data;
  },
  getEs: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<SystemHealth>('/health/elasticsearch');
    return res.data;
  }
};
