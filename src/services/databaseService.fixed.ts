// Centralized database service for all MySQL operations via REST API
export class DatabaseService {
  private static readonly apiBaseUrl = import.meta.env.VITE_API_URL;

  // --- Staff Management ---
  static async getAllStaff() {
    const res = await fetch(`${this.apiBaseUrl}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff');
    return res.json();
  }

  static async addStaff(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add staff');
    return res.json();
  }

  static async updateStaff(id: string, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update staff');
    return res.json();
  }

  static async deleteStaff(id: string, deletedBy: string) {
    const res = await fetch(`${this.apiBaseUrl}/staff/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedBy })
    });
    if (!res.ok) throw new Error('Failed to delete staff');
    return res.json();
  }

  // --- Patient Management ---
  static async getAllPatientAttendance() {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance`);
    if (!res.ok) throw new Error('Failed to fetch patient attendance');
    return res.json();
  }
  
  static async getPatientAttendance(patientId: string | number, date?: string) {
    let url = `${this.apiBaseUrl}/patient-attendance/patient/${patientId}`;
    if (date) url += `?date=${date}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch patient attendance');
    return res.json();
  }
  
  static async addPatientAttendance(data: {
    patientId: string | number,
    patientName: string,
    date: string,
    status: 'Present' | 'Absent' | 'Late',
    checkInTime?: string,
    notes?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add patient attendance');
    return res.json();
  }
  
  static async updatePatientAttendance(id: string | number, data: {
    status?: 'Present' | 'Absent' | 'Late',
    checkInTime?: string,
    notes?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient attendance');
    return res.json();
  }
  
  static async deletePatientAttendance(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient attendance');
    return res.json();
  }

  // --- Patient History Management ---
  static async updatePatientHistory(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient history');
    return res.json();
  }
  
  static async deletePatientHistory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient history');
    return res.json();
  }

  // The rest of your methods remain the same...
}
