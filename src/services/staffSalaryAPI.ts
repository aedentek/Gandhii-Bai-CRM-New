// Staff Salary API Service - Mirroring Doctor Salary functionality
// Author: CRM Development Team
// Date: 2025-08-22

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const StaffSalaryAPI = {
  // Get all staff for salary management
  async getAll(month?: number, year?: number) {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const url = `${BASE_URL}/staff-salaries${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching staff salaries:', error);
      throw error;
    }
  },

  // Record staff salary payment
  async recordPayment(paymentData: {
    staffId: string;
    amount: number;
    date: string;
    type?: string;
    payment_mode?: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${BASE_URL}/staff-salaries/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Get staff payment history
  async getPaymentHistory(staffId: string, month?: number, year?: number) {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const url = `${BASE_URL}/staff-salaries/${staffId}/history${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Update payment record
  async updatePayment(paymentId: string, paymentData: {
    paymentAmount: number;
    paymentDate: string;
    paymentMode: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${BASE_URL}/staff-salaries/payment/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete payment record
  async deletePayment(paymentId: string) {
    try {
      const response = await fetch(`${BASE_URL}/staff-salaries/payment/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // Save monthly records and carry forward balances
  async saveMonthlyRecords(month: number, year: number) {
    try {
      const response = await fetch(`${BASE_URL}/staff-salaries/save-monthly-records/${month}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving monthly records:', error);
      throw error;
    }
  },

  // Auto-run carry forward for current month
  async autoCarryForward(month: number, year: number) {
    try {
      const response = await fetch(`${BASE_URL}/staff-salaries/auto-carry-forward/${month}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in auto carry forward:', error);
      throw error;
    }
  },

  // Get monthly salary summary for all staff
  async getMonthlySummary(month: number, year: number) {
    try {
      const response = await fetch(`${BASE_URL}/staff-salaries/monthly-summary/${month}/${year}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
  },

  // Check carry forward amounts for current month
  async checkCarryForward(month: number, year: number) {
    try {
      // This will call the auto-carry-forward endpoint which updates all records
      return await this.autoCarryForward(month, year);
    } catch (error) {
      console.error('Error checking carry forward:', error);
      throw error;
    }
  }
};

export default StaffSalaryAPI;
