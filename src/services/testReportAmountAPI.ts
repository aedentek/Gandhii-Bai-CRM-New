import { TestReportAmount, CreateTestReportAmountData, UpdateTestReportAmountData } from '@/types/testReportAmount';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class TestReportAmountAPI {
  // Get all test report amounts
  static async getAll(): Promise<{ success: boolean; data: TestReportAmount[]; message?: string }> {
    try {
      console.log('🔄 Fetching all test report amounts...');
      const response = await fetch(`${API_BASE_URL}/test-reports`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform data to ensure amount is always a number
      if (result.success && result.data) {
        result.data = result.data.map((report: any) => ({
          ...report,
          amount: typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount
        }));
      }
      
      console.log('✅ Test report amounts fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching test report amounts:', error);
      return { 
        success: false, 
        data: [], 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get test report amounts by patient ID
  static async getByPatientId(patientId: string): Promise<{ success: boolean; data: TestReportAmount[]; message?: string }> {
    try {
      console.log(`🔄 Fetching test report amounts for patient ${patientId}...`);
      const response = await fetch(`${API_BASE_URL}/test-reports/patient/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform data to ensure amount is always a number
      if (result.success && result.data) {
        result.data = result.data.map((report: any) => ({
          ...report,
          amount: typeof report.amount === 'string' ? parseFloat(report.amount) : report.amount
        }));
      }
      
      console.log('✅ Patient test report amounts fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching patient test report amounts:', error);
      return { 
        success: false, 
        data: [], 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Create new test report amount
  static async create(data: CreateTestReportAmountData): Promise<{ success: boolean; data?: TestReportAmount; message?: string }> {
    try {
      console.log('💾 Creating new test report amount:', data);
      const response = await fetch(`${API_BASE_URL}/test-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Test report amount created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating test report amount:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update test report amount
  static async update(id: string, data: UpdateTestReportAmountData): Promise<{ success: boolean; data?: TestReportAmount; message?: string }> {
    try {
      console.log(`💾 Updating test report amount ${id}:`, data);
      const response = await fetch(`${API_BASE_URL}/test-reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Test report amount updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error updating test report amount:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete test report amount
  static async delete(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🗑️ Deleting test report amount ${id}...`);
      const response = await fetch(`${API_BASE_URL}/test-reports/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Test report amount deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error deleting test report amount:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get test report amounts by month and year
  static async getByMonthYear(month: number, year: number): Promise<{ success: boolean; data: TestReportAmount[]; message?: string }> {
    try {
      console.log(`🔄 Fetching test report amounts for ${month}/${year}...`);
      const response = await fetch(`${API_BASE_URL}/test-reports/month/${year}/${month}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Monthly test report amounts fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching monthly test report amounts:', error);
      return { 
        success: false, 
        data: [], 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
