import { DoctorAdvance, DoctorAdvanceFormData, DoctorListItem } from '@/types/doctorAdvance';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class DoctorAdvanceAPI {
  // Get all doctor advances
  static async getAll(): Promise<DoctorAdvance[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-advances`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctor advances');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching doctor advances:', error);
      throw error;
    }
  }

  // Get doctor advance by ID
  static async getById(id: number): Promise<DoctorAdvance> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-advances/${id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctor advance');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching doctor advance:', error);
      throw error;
    }
  }

  // Get doctor advances by doctor ID
  static async getByDoctorId(doctorId: string): Promise<DoctorAdvance[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-advances/doctor/${doctorId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctor advances');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching doctor advances by doctor ID:', error);
      throw error;
    }
  }

  // Create new doctor advance
  static async create(advanceData: DoctorAdvanceFormData): Promise<DoctorAdvance> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-advances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create doctor advance');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error creating doctor advance:', error);
      throw error;
    }
  }

  // Update doctor advance
  static async update(id: number, advanceData: DoctorAdvanceFormData): Promise<DoctorAdvance> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-advances/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update doctor advance');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating doctor advance:', error);
      throw error;
    }
  }

  // Delete doctor advance
  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-advances/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete doctor advance');
      }
    } catch (error) {
      console.error('Error deleting doctor advance:', error);
      throw error;
    }
  }

  // Get doctors list
  static async getDoctorsList(): Promise<DoctorListItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors-list`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctors list');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching doctors list:', error);
      throw error;
    }
  }
}
