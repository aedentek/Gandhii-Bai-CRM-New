// Centralized database service for all MySQL operations via REST API
export class DatabaseService {
  private static readonly apiBaseUrl = import.meta.env.VITE_API_URL;

  // === DOCTOR MANAGEMENT ===
  static async getAllDoctors() {
    const res = await fetch(`${this.apiBaseUrl}/doctors`);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    const doctors = await res.json();
    
    // Parse documents and map field names for each doctor
    return doctors.map((doctor: any) => ({
      ...doctor,
      joinDate: doctor.join_date,
      role: doctor.specialization || doctor.department,
    }));
  }

  static async getDoctorById(id: string) {
    const res = await fetch(`${this.apiBaseUrl}/doctors/${id}`);
    if (!res.ok) throw new Error('Failed to fetch doctor');
    const doctor = await res.json();
    
    return {
      ...doctor,
      joinDate: doctor.join_date,
      role: doctor.specialization || doctor.department,
    };
  }

  static async addDoctor(doctorData: any): Promise<any> {
    const res = await fetch(`${this.apiBaseUrl}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    if (!res.ok) throw new Error('Failed to add doctor');
    return res.json();
  }

  // === STAFF MANAGEMENT ===
  static async getAllStaff() {
    const res = await fetch(`${this.apiBaseUrl}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff');
    return res.json();
  }

  static async addStaff(data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    department: string;
    join_date: string;
    salary: string;
    status: string;
    photo?: string;
    documents?: any;
  }) {
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

  static async deleteStaff(id: string, deletedBy?: string) {
    const res = await fetch(`${this.apiBaseUrl}/staff/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedBy })
    });
    if (!res.ok) throw new Error('Failed to delete staff');
    return res.json();
  }

  static async getDeletedStaff() {
    const res = await fetch(`${this.apiBaseUrl}/staff/deleted`);
    if (!res.ok) throw new Error('Failed to fetch deleted staff');
    return res.json();
  }

  static async restoreStaff(id: string) {
    const res = await fetch(`${this.apiBaseUrl}/staff/${id}/restore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to restore staff');
    return res.json();
  }

  // === STAFF SALARY MANAGEMENT ===
  static async getStaffSalarySummary() {
    const res = await fetch(`${this.apiBaseUrl}/staff/salary-summary`);
    if (!res.ok) throw new Error('Failed to fetch staff salary summary');
    return res.json();
  }

  static async updateStaffSalaryPayment(id: string, data: {
    total_paid: number;
    payment_mode?: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  }) {
    const res = await fetch(`${this.apiBaseUrl}/staff/${id}/salary-payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update staff salary payment');
    return res.json();
  }

  // === PATIENT MANAGEMENT ===
  static async getAllPatients() {
    const res = await fetch(`${this.apiBaseUrl}/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  }

  static async getPatient(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient');
    return res.json();
  }

  static async addPatient(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add patient');
    return res.json();
  }

  static async updatePatient(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  }

  static async deletePatient(id: string | number) {
    try {
      // First, delete all related records (cascade deletion)
      await Promise.all([
        this.deletePatientAttendanceByPatientId(id),
        this.deletePatientHistoryByPatientId(id),
        this.deletePatientPaymentsByPatientId(id)
      ]);
      
      // Finally, delete the patient record itself
      const res = await fetch(`${this.apiBaseUrl}/patients/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete patient');
      return res.json();
    } catch (error) {
      throw new Error(`Failed to delete patient and related records: ${error.message}`);
    }
  }

  // === PATIENT ATTENDANCE ===
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

  static async deletePatientAttendanceByPatientId(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance/patient/${patientId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient attendance records');
    return res.json();
  }

  // === PATIENT HISTORY ===
  static async getAllPatientHistory() {
    const res = await fetch(`${this.apiBaseUrl}/patient-history`);
    if (!res.ok) throw new Error('Failed to fetch patient history');
    return res.json();
  }
  
  static async getPatientHistory(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/patient/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch patient history');
    return res.json();
  }
  
  static async addPatientHistory(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add patient history');
    return res.json();
  }

  static async deletePatientHistoryByPatientId(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/patient/${patientId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient history records');
    return res.json();
  }

  // === PATIENT PAYMENTS ===
  static async getAllPatientPayments() {
    const res = await fetch(`${this.apiBaseUrl}/patient-payments`);
    if (!res.ok) throw new Error('Failed to fetch patient payments');
    return res.json();
  }
  
  static async addPatientPayment(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patient-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add patient payment');
    return res.json();
  }

  static async deletePatientPaymentsByPatientId(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-payments/patient/${patientId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient payment records');
    return res.json();
  }
}
