// Patient Fees API Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const PatientFeesAPI = {
  // Get all patients with fees data
  getAll: async (month, year) => {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const response = await fetch(`${API_BASE_URL}/patient-fees/patient-fees?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch patient fees');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching patient fees:', error);
      throw error;
    }
  },

  // Record a fee payment
  recordPayment: async (paymentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-fees/record-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to record payment');
      }
      
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Get payment history for a patient
  getPaymentHistory: async (patientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-fees/payment-history/${patientId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment history');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Delete a payment record
  deletePayment: async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-fees/payment/${paymentId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete payment');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // Check and update carry forward amounts
  checkCarryForward: async (month, year) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient-fees/check-carry-forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, year }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check carry forward');
      }
      
      return data;
    } catch (error) {
      console.error('Error checking carry forward:', error);
      throw error;
    }
  }
};
