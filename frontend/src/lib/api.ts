const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getAuthToken(): string | null {
  return localStorage.getItem('healthtwin_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('healthtwin_token', token);
  } else {
    localStorage.removeItem('healthtwin_token');
    localStorage.removeItem('healthtwin_role');
    localStorage.removeItem('healthtwin_user_id');
    localStorage.removeItem('healthtwin_user_name');
  }
}

export function getUserRole(): string | null {
  return localStorage.getItem('healthtwin_role');
}

export function getUserId(): string | null {
  return localStorage.getItem('healthtwin_user_id');
}

export function getUserName(): string | null {
  return localStorage.getItem('healthtwin_user_name');
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-detect JSON payload
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMessage = 'An error occurred';
    try {
      const errJson = JSON.parse(errText);
      errMessage = errJson.detail || errMessage;
    } catch {
      errMessage = errText || errMessage;
    }
    throw new Error(errMessage);
  }

  return response.json();
}

export const api = {
  async login(email: string, password: string): Promise<any> {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    localStorage.setItem('healthtwin_role', res.role);
    localStorage.setItem('healthtwin_user_id', res.userId);
    localStorage.setItem('healthtwin_user_name', res.name);
    return res;
  },

  logout() {
    setAuthToken(null);
  },

  // Patient endpoints
  getRecords() {
    return request('/patients/me/records');
  },

  async uploadRecord(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request('/patients/me/records', {
      method: 'POST',
      body: formData,
    });
  },

  async downloadRecordFile(recordId: string): Promise<Blob> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/records/${recordId}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error('Failed to download document or access denied.');
    }
    return response.blob();
  },

  confirmRecord(recordId: string, confirmData: any) {
    return request(`/patients/me/records/${recordId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(confirmData),
    });
  },

  getDigitalTwin() {
    return request('/patients/me/digital-twin');
  },

  getMedications() {
    return request('/patients/me/medications');
  },

  getAllergiesConditions() {
    return request('/patients/me/allergies-conditions');
  },

  getLabsTrends() {
    return request('/patients/me/labs');
  },

  getTimeline() {
    return request('/patients/me/timeline');
  },

  getSafetyAlerts() {
    return request('/patients/me/safety-alerts');
  },

  getConsents() {
    return request('/patients/me/consents');
  },

  createConsent(granteeEmail: string, dataCategory: string, permission: string, expiresAt?: string) {
    return request('/patients/me/consents', {
      method: 'POST',
      body: JSON.stringify({
        grantee_email: granteeEmail,
        data_category: dataCategory,
        permission,
        expires_at: expiresAt || null,
      }),
    });
  },

  revokeConsent(consentId: string) {
    return request(`/patients/me/consents/${consentId}`, {
      method: 'DELETE',
    });
  },

  getAccessLog() {
    return request('/patients/me/access-log');
  },

  getEmergencyProfile() {
    return request('/patients/me/emergency');
  },

  // Doctor endpoints
  getDoctorPatients() {
    return request('/doctor/patients');
  },

  getDoctorPatientSnapshot(patientId: string) {
    return request(`/doctor/patients/${patientId}`);
  },
};
