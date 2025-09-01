import { StaffAdvance, StaffAdvanceFormData, StaffListItem } from '@/types/staffAdvance';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class StaffAdvanceAPI {
  // Get all staff advances
  static async getAll(): Promise<StaffAdvance[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-advances`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch staff advances');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching staff advances:', error);
      throw error;
    }
  }

  // Get staff advance by ID
  static async getById(id: number): Promise<StaffAdvance> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-advances/${id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch staff advance');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching staff advance:', error);
      throw error;
    }
  }

  // Get staff advances by staff ID
  static async getByStaffId(staffId: string): Promise<StaffAdvance[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-advances/staff/${staffId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch staff advances');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching staff advances by staff ID:', error);
      throw error;
    }
  }

  // Create new staff advance
  static async create(advanceData: StaffAdvanceFormData): Promise<StaffAdvance> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-advances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create staff advance');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error creating staff advance:', error);
      throw error;
    }
  }

  // Update staff advance
  static async update(id: number, advanceData: StaffAdvanceFormData): Promise<StaffAdvance> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-advances/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advanceData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update staff advance');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating staff advance:', error);
      throw error;
    }
  }

  // Delete staff advance
  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-advances/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete staff advance');
      }
    } catch (error) {
      console.error('Error deleting staff advance:', error);
      throw error;
    }
  }

  // Get staff list
  static async getStaffList(): Promise<StaffListItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/staff-list`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch staff list');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching staff list:', error);
      throw error;
    }
  }
}
