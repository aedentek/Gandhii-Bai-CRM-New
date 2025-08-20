import { DoctorSalary, DoctorSalaryPayment, DoctorSalaryHistory } from '../types/doctorSalary';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class DoctorSalaryAPI {
  // Get all doctors with salary information
  static async getAllDoctorsWithSalary(): Promise<DoctorSalary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-salaries`);
      if (!response.ok) {
        throw new Error(`Failed to fetch doctors with salary: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching doctors with salary:', error);
      throw error;
    }
  }

  // Get doctor salary by ID
  static async getDoctorSalaryById(doctorId: string): Promise<DoctorSalary | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-salaries/${doctorId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch doctor salary: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching doctor salary:', error);
      throw error;
    }
  }

  // Get salary history for a doctor
  static async getSalaryHistory(doctorId: string): Promise<DoctorSalaryHistory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-salaries/${doctorId}/history`);
      if (!response.ok) {
        throw new Error(`Failed to fetch salary history: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching salary history:', error);
      throw error;
    }
  }

  // Process salary payment (legacy compatibility method)
  static async processSalaryPayment(paymentData: {
    doctorId: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
    notes?: string;
  }): Promise<any> {
    try {
      console.log('🏦 Processing salary payment:', paymentData);

      // Get current doctor data first to calculate totals
      const currentDoctor = await this.getDoctorSalaryById(paymentData.doctorId);
      if (!currentDoctor) {
        throw new Error('Doctor not found');
      }
      
      const currentTotalPaid = parseFloat(currentDoctor.total_paid?.toString() || '0');
      const paymentAmount = parseFloat(String(paymentData.paymentAmount));
      const newTotalPaid = currentTotalPaid + paymentAmount;
      
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // 1-12
      const year = currentDate.getFullYear();

      // Prepare payment data for new API
      const salaryPaymentData: DoctorSalaryPayment = {
        doctorId: paymentData.doctorId,
        paymentAmount: paymentAmount,
        paymentDate: paymentData.paymentDate,
        paymentMode: paymentData.paymentMode,
        previousTotalPaid: currentTotalPaid,
        newTotalPaid: newTotalPaid,
        notes: paymentData.notes || '',
        month: month,
        year: year,
        status: 'Paid'
      };

      // Process payment through new API endpoint
      const response = await fetch(`${API_BASE_URL}/doctor-salaries/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryPaymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to process payment: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Salary payment processed successfully',
        data: {
          doctorId: paymentData.doctorId,
          paymentAmount: paymentAmount,
          previousTotal: currentTotalPaid,
          newTotal: newTotalPaid,
          paymentDate: paymentData.paymentDate,
          paymentMode: paymentData.paymentMode
        }
      };
    } catch (error) {
      console.error('Error processing salary payment:', error);
      throw error;
    }
  }

  // Update salary payment
  static async updateSalaryPayment(paymentId: number, paymentData: Partial<DoctorSalaryPayment>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-salaries/payment/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update payment: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating salary payment:', error);
      throw error;
    }
  }

  // Delete salary payment
  static async deleteSalaryPayment(paymentId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor-salaries/payment/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete payment: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting salary payment:', error);
      throw error;
    }
  }
}
