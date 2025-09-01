// Patient Payment Fees API Service - Direct API calls approach
// Author: CRM Development Team
// Date: 2025-08-26

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const PatientPaymentAPI = {
  // Get all patients with payment data
  async getAll(month?: number, year?: number, page?: number, limit?: number) {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      const url = `${BASE_URL}/patient-payments/all${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching patient payments:', error);
      throw error;
    }
  },

  // Record patient payment
  async recordPayment(paymentData: {
    patientId: string;
    amount: number;
    method: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${BASE_URL}/patient-payments/record-payment`, {
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

  // Get patient payment history
  async getPaymentHistory(patientId: string) {
    try {
      const response = await fetch(`${BASE_URL}/patient-payments/history/${patientId}`);
      
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

  // Delete payment record
  async deletePayment(paymentId: string) {
    try {
      const response = await fetch(`${BASE_URL}/patient-payments/${paymentId}`, {
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

  // Update payment record
  async updatePayment(paymentId: string, paymentData: {
    paymentAmount: number;
    paymentDate: string;
    paymentMode: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${BASE_URL}/patient-payments/payment/${paymentId}`, {
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

  // Save monthly records and carry forward balances
  async saveMonthlyRecords(month: number, year: number) {
    try {
      const response = await fetch(`${BASE_URL}/patient-payments/save-monthly-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          year
        }),
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
      const response = await fetch(`${BASE_URL}/patient-payments/auto-carry-forward/${month}/${year}`, {
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

  // Check carry forward amounts for current month (exactly like doctor salary)
  async checkCarryForward(month: number, year: number) {
    try {
      const response = await fetch(`${BASE_URL}/patient-payments/carry-forward/${month}/${year}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking carry forward:', error);
      throw error;
    }
  },
};
