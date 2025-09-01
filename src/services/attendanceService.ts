import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  modifiedTime?: string;
}

export class AttendanceService {
  private static API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  static async checkIn(patientId: string, patientName: string): Promise<AttendanceRecord> {
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm:ss');
    
    // Calculate status based on time
    const hour = now.getHours();
    const minute = now.getMinutes();
    let status: 'Present' | 'Late' = 'Present';
    
    // If check-in after 10:00 AM, mark as Late
    if (hour > 10 || (hour === 10 && minute > 0)) {
      status = 'Late';
    }

    const response = await fetch(`${this.API_URL}/patient-attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        patientName,
        date: currentDate,
        checkInTime: currentTime,
        status
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to record check-in');
    }

    return await response.json();
  }

  static async updateStatus(id: string, status: 'Present' | 'Absent' | 'Late', notes?: string): Promise<AttendanceRecord> {
    const response = await fetch(`${this.API_URL}/patient-attendance/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        notes
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update attendance status');
    }

    return await response.json();
  }

  static async getAllAttendance(): Promise<AttendanceRecord[]> {
    const response = await fetch(`${this.API_URL}/patient-attendance`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch attendance records');
    }

    return await response.json();
  }
}
