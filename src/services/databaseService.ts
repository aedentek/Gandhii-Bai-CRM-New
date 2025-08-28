// Centralized database service for all MySQL operations via REST API
export class DatabaseService {
  private static readonly apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  // --- Staff Management ---
  // Empty space - removing duplicate methods as they are defined later in the file

  // --- Medicine Stock History ---
  // Get medicine stock history for a product
  static async getMedicineStockHistory(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-stock-history/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch medicine stock history');
    return res.json();
  }

  // Add a medicine stock history record
  static async addMedicineStockHistoryRecord(data: {
    product_id: string | number,
    stock_change: number,
    stock_type: 'used' | 'added' | 'adjusted',
    current_stock_before: number,
    current_stock_after: number,
    update_date: string,
    description?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-stock-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add medicine stock history record');
    return res.json();
  }

  // Delete a medicine stock history record
  static async deleteMedicineStockHistoryRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-stock-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete medicine stock history record');
    return res.json();
  }

  // CRUD for general categories
  // CRUD for general suppliers
  // CRUD for general products
  static async getAllGeneralProducts() {
    const res = await fetch(`${this.apiBaseUrl}/general-products`);
    if (!res.ok) throw new Error('Failed to fetch general products');
    return res.json();
  }
  
  static async getGeneralProductById(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch general product');
    return res.json();
  }
  
  static async addGeneralProduct(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/general-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add general product');
    return res.json();
  }
  static async updateGeneralProduct(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update general product');
    return res.json();
  }
  
  // Update accounting information for a general product
  static async updateGeneralProductAccounting(id: string | number, data: {
    purchase_amount?: number,
    settlement_amount?: number,
    balance_amount?: number,
    payment_status?: string,
    payment_type?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update accounting information');
    return res.json();
  }
  static async deleteGeneralProduct(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete general product');
    return res.json();
  }

  // Settlement History CRUD operations
  static async getSettlementHistory(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/settlement-history/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch settlement history');
    return res.json();
  }

  static async addSettlementRecord(data: {
    product_id: string | number,
    amount: number,
    payment_date: string,
    payment_type?: string,
    description?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/settlement-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add settlement record');
    return res.json();
  }

  static async deleteSettlementRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/settlement-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete settlement record');
    return res.json();
  }
  static async getAllGeneralSuppliers() {
    const res = await fetch(`${this.apiBaseUrl}/general-suppliers`);
    if (!res.ok) throw new Error('Failed to fetch general suppliers');
    return res.json();
  }
  static async addGeneralSupplier(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/general-suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add general supplier');
    return res.json();
  }
  static async updateGeneralSupplier(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/general-suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update general supplier');
    return res.json();
  }
  static async deleteGeneralSupplier(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/general-suppliers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete general supplier');
    return res.json();
  }
  static async getAllGeneralCategories() {
    const res = await fetch(`${this.apiBaseUrl}/general-categories`);
    if (!res.ok) throw new Error('Failed to fetch general categories');
    return res.json();
  }
  static async addGeneralCategory(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/general-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add general category');
    return res.json();
  }
  static async updateGeneralCategory(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/general-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update general category');
    return res.json();
  }
  static async deleteGeneralCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/general-categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete general category');
    return res.json();
  }
  static async getAllLeadCategories() {
    const res = await fetch(`${this.apiBaseUrl}/lead-categories`);
    if (!res.ok) throw new Error('Failed to fetch lead categories');
    return res.json();
  }
  static async addLeadCategory(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/lead-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add lead category');
    return res.json();
  }
  static async updateLeadCategory(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/lead-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update lead category');
    return res.json();
  }
  static async deleteLeadCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/lead-categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete lead category');
    return res.json();
  }
  
  // Update all leads that reference an old category name to use the new category name
  static async updateLeadCategoryReferences(oldCategoryName: string, newCategoryName: string) {
    const res = await fetch(`${this.apiBaseUrl}/leads/update-category-references`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldCategoryName, newCategoryName })
    });
    if (!res.ok) throw new Error('Failed to update lead category references');
    return res.json();
  }

  // CRUD for users
  static async getAllUsers() {
    const res = await fetch(`${this.apiBaseUrl}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  }
  static async getUser(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/users/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  }
  static async addUser(data: { name: string; email: string }) {
    const res = await fetch(`${this.apiBaseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add user');
    return res.json();
  }
  static async updateUser(id: string | number, data: { name: string; email: string }) {
    const res = await fetch(`${this.apiBaseUrl}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  }
  static async deleteUser(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/users/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  }

  // CRUD for leads
  static async getAllLeads() {
    const res = await fetch(`${this.apiBaseUrl}/leads`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  }
  static async getLead(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/leads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch lead');
    return res.json();
  }
  static async addLead(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add lead');
    return res.json();
  }
  static async updateLead(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
  }
  static async deleteLead(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/leads/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete lead');
    return res.json();
  }

  // CRUD for patients
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
      
      // 1. Delete patient attendance records
      try {
        await this.deletePatientAttendanceByPatientId(id);
      } catch (error) {
        console.warn('Failed to delete patient attendance records:', error);
      }
      
      // 2. Delete patient history records  
      try {
        await this.deletePatientHistoryByPatientId(id);
      } catch (error) {
        console.warn('Failed to delete patient history records:', error);
      }
      
      // 3. Delete patient payment records
      try {
        await this.deletePatientPaymentsByPatientId(id);
      } catch (error) {
        console.warn('Failed to delete patient payment records:', error);
      }
      
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

  // CRUD for patient payments
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

  static async updatePatientPayment(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patient-payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient payment');
    return res.json();
  }

  static async deletePatientPayment(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-payments/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient payment');
    return res.json();
  }

  // CASCADE DELETION HELPER METHODS FOR PATIENTS
  
  // Delete all patient attendance records for a specific patient
  static async deletePatientAttendanceByPatientId(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance/patient/${patientId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient attendance records');
    return res.json();
  }
  
  // Delete all patient history records for a specific patient  
  static async deletePatientHistoryByPatientId(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/patient/${patientId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient history records');
    return res.json();
  }
  
  // Delete all patient payment records for a specific patient
  static async deletePatientPaymentsByPatientId(patientId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-payments/patient/${patientId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient payment records');
    return res.json();
  }

  // CRUD for patient history
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
  
  static async getPatientHistoryRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient history record');
    return res.json();
  }
  
  static async addPatientHistory(data: any) {
    console.log('🔗 DatabaseService.addPatientHistory called with:', data);
    console.log('🔗 API URL:', `${this.apiBaseUrl}/patient-history`);
    
    const res = await fetch(`${this.apiBaseUrl}/patient-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log('🔗 Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('🔗 Response error:', errorText);
      throw new Error(`Failed to add patient history record: ${res.status} - ${errorText}`);
    }
    
    const result = await res.json();
    console.log('🔗 Response result:', result);
    return result;
  }
  
  static async updatePatientHistory(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update patient history record');
    return res.json();
  }
  
  static async deletePatientHistory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete patient history record');
    return res.json();
  }

  // CRUD for patient attendance
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
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to add patient attendance record');
    }
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
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to update patient attendance record');
    }
    return res.json();
  }
  
  static async markPatientAttendance(data: {
    patientId: string;
    patientName: string;
    date: string;
    checkInTime?: string;
    status: 'Present' | 'Absent' | 'Late';
  }) {
    // Always use POST - the backend handles insert/update logic
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to mark patient attendance');
    return res.json();
  }

  static async deletePatientAttendance(patientId: string, date: string) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        date
      })
    });
    if (!res.ok) throw new Error('Failed to delete patient attendance');
    return res.json();
  }

  // Delete patient attendance by record ID
  static async deletePatientAttendanceById(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/patient-attendance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete patient attendance record');
    }
    return res.json();
  }

  // CRUD for staff
  static async getAllStaff() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/staff`);
      if (!res.ok) throw new Error('Failed to fetch staff');
      return await res.json();
    } catch (error) {
      console.error('Error fetching all staff:', error);
      throw error;
    }
  }
  
  static async getDeletedStaff() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/staff/deleted`);
      if (!res.ok) throw new Error('Failed to fetch deleted staff');
      const data = await res.json();
      console.log('Raw deleted staff data from API:', data);
      return data;
    } catch (error) {
      console.error('Error fetching deleted staff:', error);
      throw error;
    }
  }
  
  static async getStaff(id: string) {
    try {
      const res = await fetch(`${this.apiBaseUrl}/staff/${id}`);
      if (!res.ok) throw new Error('Failed to fetch staff member');
      return await res.json();
    } catch (error) {
      console.error(`Error fetching staff member ${id}:`, error);
      throw error;
    }
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
    status: 'Active' | 'Inactive';
    photo?: string;
    documents?: {
      CardFront?: string;
      CardBack?: string;
      panCardFront?: string;
      panCardBack?: string;
      [key: string]: string | undefined;
    };
  }) {
    try {
      const res = await fetch(`${this.apiBaseUrl}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add staff member');
      }
      return await res.json();
    } catch (error) {
      console.error('Error adding staff member:', error);
      throw error;
    }
  }
  
  static async updateStaff(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    department: string;
    join_date: string;
    salary: string;
    status: 'Active' | 'Inactive';
    photo?: string;
    documents?: {
      Front?: string;
      Back?: string;
      panCardFront?: string;
      panCardBack?: string;
      [key: string]: string | undefined;
    };
  }>) {
    try {
      const res = await fetch(`${this.apiBaseUrl}/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update staff member');
      }
      return await res.json();
    } catch (error) {
      console.error(`Error updating staff member ${id}:`, error);
      throw error;
    }
  }
  
  static async deleteStaff(id: string, deletedBy?: string) {
    try {
      const res = await fetch(`${this.apiBaseUrl}/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: deletedBy || 'System' })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete staff member');
      }
      return await res.json();
    } catch (error) {
      console.error(`Error deleting staff member ${id}:`, error);
      throw error;
    }
  }
  
  static async restoreStaff(id: string) {
    const res = await fetch(`${this.apiBaseUrl}/staff/${id}/restore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to restore staff member');
    return res.json();
  }

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

  // CRUD for staff categories
  static async getAllStaffCategories() {
    const res = await fetch(`${this.apiBaseUrl}/staff-categories`);
    if (!res.ok) throw new Error('Failed to fetch staff categories');
    return res.json();
  }
  
  static async getStaffCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/staff-categories/${id}`);
    if (!res.ok) throw new Error('Failed to fetch staff category');
    return res.json();
  }
  
  static async addStaffCategory(data: {
    name: string;
    description?: string;
    status?: string;
    quantity?: number;
  }) {
    const res = await fetch(`${this.apiBaseUrl}/staff-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add staff category');
    }
    return res.json();
  }
  
  static async updateStaffCategory(id: string | number, data: {
    name: string;
    description?: string;
    status?: string;
    quantity?: number;
  }) {
    const res = await fetch(`${this.apiBaseUrl}/staff-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update staff category');
    }
    return res.json();
  }
  
  static async deleteStaffCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/staff-categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete staff category');
    return res.json();
  }

  // CRUD for general stock
  static async getAllGeneralStock() {
    const res = await fetch(`${this.apiBaseUrl}/general-stock`);
    if (!res.ok) throw new Error('Failed to fetch general stock');
    return res.json();
  }
  static async updateGeneralStock(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/stock/general-stock/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update general stock');
    return res.json();
  }
  // --- General Stock Settlement History ---
  // Get settlement history for a general product
  static async getGeneralStockSettlements(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${productId}/settlements`);
    if (!res.ok) throw new Error('Failed to fetch settlement history');
    return res.json();
  }
  // Add a settlement record for a general product
  static async addGeneralStockSettlement(productId: string | number, data: { date: string, amount: number }) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${productId}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add settlement');
    return res.json();
  }
  // Delete a settlement record by index for a general product
  static async deleteGeneralStockSettlement(productId: string | number, idx: number) {
    const res = await fetch(`${this.apiBaseUrl}/general-products/${productId}/settlements/${idx}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete settlement');
    return res.json();
  }

  // --- Stock History for General Products ---
  // Get stock history for a product
  static async getStockHistory(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/stock-history/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch stock history');
    return res.json();
  }

  // Add a stock history record
  static async addStockHistoryRecord(data: {
    product_id: string | number,
    stock_change: number,
    stock_type: 'used' | 'added' | 'adjusted',
    current_stock_before: number,
    current_stock_after: number,
    update_date: string,
    description?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/stock-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add stock history record');
    return res.json();
  }

  // Delete a stock history record
  static async deleteStockHistoryRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/stock-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete stock history record');
    return res.json();
  }

  // === MEDICINE CATEGORIES CRUD OPERATIONS ===
  
  // CRUD for medicine categories
  static async getAllMedicineCategories() {
    const res = await fetch(`${this.apiBaseUrl}/medicine-categories`);
    if (!res.ok) throw new Error('Failed to fetch medicine categories');
    return res.json();
  }
  static async addMedicineCategory(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add medicine category');
    return res.json();
  }
  static async updateMedicineCategory(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update medicine category');
    return res.json();
  }
  static async deleteMedicineCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete medicine category');
    return res.json();
  }

  // CRUD for medicine suppliers
  static async getAllMedicineSuppliers() {
    const res = await fetch(`${this.apiBaseUrl}/medicine-suppliers`);
    if (!res.ok) throw new Error('Failed to fetch medicine suppliers');
    return res.json();
  }
  static async addMedicineSupplier(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add medicine supplier');
    return res.json();
  }
  static async updateMedicineSupplier(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update medicine supplier');
    return res.json();
  }
  static async deleteMedicineSupplier(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-suppliers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete medicine supplier');
    return res.json();
  }

  // CRUD for medicine products
  static async getAllMedicineProducts() {
    const res = await fetch(`${this.apiBaseUrl}/medicine-products`);
    if (!res.ok) throw new Error('Failed to fetch medicine products');
    return res.json();
  }
  static async addMedicineProduct(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add medicine product');
    return res.json();
  }
  static async updateMedicineProduct(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update medicine product');
    return res.json();
  }
  static async deleteMedicineProduct(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete medicine product');
    return res.json();
  }

  // CRUD for medicine settlement history
  static async getMedicineSettlementHistory(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-settlement-history/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch medicine settlement history');
    return res.json();
  }
  static async addMedicineSettlementRecord(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-settlement-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add medicine settlement record');
    return res.json();
  }
  static async deleteMedicineSettlementRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/medicine-settlement-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete medicine settlement record');
    return res.json();
  }

  // === GROCERY MANAGEMENT CRUD OPERATIONS ===
  
  // CRUD for grocery products
  static async getAllGroceryProducts() {
    const res = await fetch(`${this.apiBaseUrl}/grocery-products`);
    if (!res.ok) throw new Error('Failed to fetch grocery products');
    return res.json();
  }
  static async addGroceryProduct(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add grocery product');
    return res.json();
  }
  static async updateGroceryProduct(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update grocery product');
    return res.json();
  }
  
  // Update grocery stock (for stock adjustment operations)
  static async updateGroceryStock(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update grocery stock');
    return res.json();
  }
  static async deleteGroceryProduct(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete grocery product');
    return res.json();
  }

  // CRUD for grocery categories
  static async getAllGroceryCategories() {
    const res = await fetch(`${this.apiBaseUrl}/grocery-categories`);
    if (!res.ok) throw new Error('Failed to fetch grocery categories');
    return res.json();
  }
  static async addGroceryCategory(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add grocery category');
    return res.json();
  }
  static async updateGroceryCategory(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update grocery category');
    return res.json();
  }
  static async deleteGroceryCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete grocery category');
    return res.json();
  }

  // CRUD for grocery suppliers
  static async getAllGrocerySuppliers() {
    const res = await fetch(`${this.apiBaseUrl}/grocery-suppliers`);
    if (!res.ok) throw new Error('Failed to fetch grocery suppliers');
    return res.json();
  }
  static async addGrocerySupplier(data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add grocery supplier');
    return res.json();
  }
  static async updateGrocerySupplier(id: string | number, data: any) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update grocery supplier');
    return res.json();
  }
  static async deleteGrocerySupplier(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-suppliers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete grocery supplier');
    return res.json();
  }

  // Grocery Settlement History CRUD operations
  static async getGrocerySettlementHistory(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-settlement-history/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch grocery settlement history');
    return res.json();
  }

  static async addGrocerySettlementRecord(data: {
    product_id: string | number,
    amount: number,
    payment_date: string,
    payment_type?: string,
    description?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-settlement-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add grocery settlement record');
    return res.json();
  }

  static async deleteGrocerySettlementRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-settlement-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete grocery settlement record');
    return res.json();
  }

  // Grocery Stock History CRUD operations
  static async getGroceryStockHistory(productId: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-stock-history/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch grocery stock history');
    return res.json();
  }

  static async addGroceryStockHistoryRecord(data: {
    product_id: string | number,
    stock_change: number,
    stock_type: 'used' | 'added' | 'adjusted',
    current_stock_before: number,
    current_stock_after: number,
    update_date: string,
    description?: string
  }) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-stock-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add grocery stock history record');
    return res.json();
  }

  static async deleteGroceryStockHistoryRecord(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/grocery-stock-history/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete grocery stock history record');
    return res.json();
  }

  // Doctor Categories methods
  static async getAllDoctorCategories() {
    const res = await fetch(`${this.apiBaseUrl}/doctor-categories`);
    if (!res.ok) throw new Error('Failed to fetch doctor categories');
    return res.json();
  }

  static async addDoctorCategory(data: {
    name: string;
    description?: string;
    status?: 'active' | 'inactive';
  }) {
    const res = await fetch(`${this.apiBaseUrl}/doctor-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add doctor category');
    return res.json();
  }

  static async updateDoctorCategory(id: string | number, data: {
    name?: string;
    description?: string;
    status?: 'active' | 'inactive';
  }) {
    const res = await fetch(`${this.apiBaseUrl}/doctor-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update doctor category');
    return res.json();
  }

  static async deleteDoctorCategory(id: string | number) {
    const res = await fetch(`${this.apiBaseUrl}/doctor-categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete doctor category');
    return res.json();
  }

  // Doctors methods
  static async getAllDoctors() {
    const res = await fetch(`${this.apiBaseUrl}/doctors`);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    const doctors = await res.json();
    
    // Parse documents and map field names for each doctor
    return doctors.map((doctor: any) => {
      const parsedDoctor = { 
        ...doctor,
        // Map API field names to frontend field names
        joinDate: doctor.join_date,
        role: doctor.specialization || doctor.department, // For table display
      };
      
      // Parse documents if it's a string - handle multiple levels of escaping
      if (doctor.documents && typeof doctor.documents === 'string') {
        try {
          let documents = doctor.documents;
          
          // Handle multiple levels of JSON escaping
          while (typeof documents === 'string' && documents.startsWith('"')) {
            documents = JSON.parse(documents);
          }
          
          // If we still have a string, try parsing it as JSON
          if (typeof documents === 'string') {
            documents = JSON.parse(documents);
          }
          
          // Only add document fields if documents is an object and has valid data
          if (documents && typeof documents === 'object') {
            const hasValidDocuments = Object.values(documents).some(doc => doc && doc !== '');
            
            if (hasValidDocuments) {
              parsedDoctor.Front = documents.Front || null;
              parsedDoctor.CardBack = documents.CardBack || null;
              parsedDoctor.panCardFront = documents.panCardFront || null;
              parsedDoctor.panCardBack = documents.panCardBack || null;
              parsedDoctor.documents = documents; // Keep the parsed documents object too
            }
          }
        } catch (error) {
          console.error('Error parsing documents for doctor:', doctor.id, error);
          console.error('Raw documents string:', doctor.documents);
        }
      }
      
      return parsedDoctor;
    });
  }

  static async getDoctorById(id: string) {
    const res = await fetch(`${this.apiBaseUrl}/doctors/${id}`);
    if (!res.ok) throw new Error('Failed to fetch doctor');
    const doctor = await res.json();
    
    // Map API field names to frontend field names
    const parsedDoctor = {
      ...doctor,
      joinDate: doctor.join_date,
      role: doctor.specialization || doctor.department,
    };
    
    // Parse documents if it's a string - handle multiple levels of escaping
    if (doctor.documents && typeof doctor.documents === 'string') {
      try {
        let documents = doctor.documents;
        
        // Handle multiple levels of JSON escaping
        while (typeof documents === 'string' && documents.startsWith('"')) {
          documents = JSON.parse(documents);
        }
        
        // If we still have a string, try parsing it as JSON
        if (typeof documents === 'string') {
          documents = JSON.parse(documents);
        }
        
        // Only add document fields if documents is an object and has valid data
        if (documents && typeof documents === 'object') {
          const hasValidDocuments = Object.values(documents).some(doc => doc && doc !== '');
          
          if (hasValidDocuments) {
            parsedDoctor.Front = documents.Front || null;
            parsedDoctor.CardBack = documents.CardBack || null;
            parsedDoctor.panCardFront = documents.panCardFront || null;
            parsedDoctor.panCardBack = documents.panCardBack || null;
            parsedDoctor.documents = documents; // Keep the parsed documents object too
          }
        }
      } catch (error) {
        console.error('Error parsing documents for doctor:', doctor.id, error);
        console.error('Raw documents string:', doctor.documents);
      }
    }
    
    return parsedDoctor;
  }

  static async addDoctor(doctorData: any): Promise<any> {
    try {
      console.log('DatabaseService.addDoctor() - Starting with data:', doctorData);
      
      // First, get the next available sequential ID (DOC001, DOC002, etc.)
      const nextIdResponse = await fetch(`${this.apiBaseUrl}/doctors/next-id`);
      if (!nextIdResponse.ok) {
        throw new Error('Failed to get next doctor ID');
      }
      const nextIdData = await nextIdResponse.json();
      const doctorId = nextIdData.nextId;
      console.log('DatabaseService.addDoctor() - Got next sequential ID:', doctorId);

      // Prepare the doctor data with the correct field names and structure
      const doctorPayload = {
        id: doctorId,
        name: doctorData.name,
        email: doctorData.email,
        phone: doctorData.phone,
        address: doctorData.address,
        specialization: doctorData.specialization,
        department: doctorData.department,
        join_date: doctorData.join_date, // Use join_date field directly
        salary: doctorData.salary,
        status: 'Active', // Default status
        photo: doctorData.photo,
        documents: doctorData.documents
      };

      console.log('DatabaseService.addDoctor() - Sending payload:', doctorPayload);
      
      const response = await fetch(`${this.apiBaseUrl}/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctorPayload),
      });

      console.log('DatabaseService.addDoctor() - Response status:', response.status);
      console.log('DatabaseService.addDoctor() - Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          // Try to get error details from response
          const errorText = await response.text();
          console.log('DatabaseService.addDoctor() - Error response text:', errorText);
          
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorJson.message || errorText;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.log('DatabaseService.addDoctor() - Error parsing error response:', parseError);
        }
        
        console.log('DatabaseService.addDoctor() - Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('DatabaseService.addDoctor() - Success result:', result);
      return result;
    } catch (error) {
      console.error('DatabaseService.addDoctor() - Catch block error:', error);
      throw new Error(`Failed to add doctor: ${error.message}`);
    }
  }

  static async updateDoctor(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    specialization?: string;
    department?: string;
    join_date?: string;
    salary?: number;
    status?: 'Active' | 'Inactive';
    photo?: string;
    documents?: any;
    total_paid?: number;
    payment_mode?: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  }) {
    const res = await fetch(`${this.apiBaseUrl}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update doctor');
    return res.json();
  }

  static async deleteDoctor(id: string, deletedBy?: string) {
    const res = await fetch(`${this.apiBaseUrl}/doctors/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedBy: deletedBy || 'System' })
    });
    if (!res.ok) throw new Error('Failed to delete doctor');
    return res.json();
  }

  // Get deleted doctors
  static async getDeletedDoctors() {
    console.log('DatabaseService.getDeletedDoctors() - Fetching deleted doctors');
    const res = await fetch(`${this.apiBaseUrl}/doctors/deleted`);
    if (!res.ok) throw new Error('Failed to fetch deleted doctors');
    const doctors = await res.json();
    console.log('DatabaseService.getDeletedDoctors() - Raw API response:', doctors);
    
    // Parse and map field names for deleted doctors
    const mappedDoctors = doctors.map((doctor: any) => {
      const parsedDoctor = { 
        ...doctor,
        joinDate: doctor.join_date,
        deletedAt: doctor.deletedAt || doctor.deleted_at,
        deletedBy: doctor.deletedBy || doctor.deleted_by || 'System',
        role: doctor.specialization || doctor.department,
      };
      
      // Parse documents if it's a string - handle multiple levels of escaping
      if (doctor.documents && typeof doctor.documents === 'string') {
        try {
          let documents = doctor.documents;
          
          // Handle multiple levels of JSON escaping
          while (typeof documents === 'string' && documents.startsWith('"')) {
            documents = JSON.parse(documents);
          }
          
          // If we still have a string, try parsing it as JSON
          if (typeof documents === 'string') {
            documents = JSON.parse(documents);
          }
          
          // Only add document fields if documents is an object and has valid data
          if (documents && typeof documents === 'object') {
            const hasValidDocuments = Object.values(documents).some(doc => doc && doc !== '');
            
            if (hasValidDocuments) {
              parsedDoctor.Front = documents.Front || null;
              parsedDoctor.CardBack = documents.CardBack || null;
              parsedDoctor.panCardFront = documents.panCardFront || null;
              parsedDoctor.panCardBack = documents.panCardBack || null;
              parsedDoctor.documents = documents;
            }
          }
        } catch (error) {
          console.error('Error parsing documents for deleted doctor:', doctor.id, error);
        }
      }
      
      return parsedDoctor;
    });
    
    console.log('DatabaseService.getDeletedDoctors() - Mapped doctors:', mappedDoctors);
    return mappedDoctors;
  }

  // Restore deleted doctor
  static async restoreDoctor(id: string) {
    const res = await fetch(`${this.apiBaseUrl}/doctors/${id}/restore`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to restore doctor');
    return res.json();
  }

  // Doctor Attendance methods
  static async getAllDoctorAttendance(date?: string, doctorId?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (doctorId) params.append('doctor_id', doctorId);
    
    const res = await fetch(`${this.apiBaseUrl}/doctor-attendance?${params}`);
    if (!res.ok) throw new Error('Failed to fetch doctor attendance');
    return res.json();
  }

  static async markDoctorAttendance(data: {
    doctor_id: string;
    doctor_name: string;
    date: string;
    check_in?: string;
    status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  }) {
    const res = await fetch(`${this.apiBaseUrl}/doctor-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to mark attendance');
    return res.json();
  }

  static async updateDoctorAttendance(id: number, data: {
    check_in?: string;
    check_out?: string;
    status?: 'Present' | 'Absent' | 'Late' | 'Half Day';
    working_hours?: string;
  }) {
    const res = await fetch(`${this.apiBaseUrl}/doctor-attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update attendance');
    return res.json();
  }

  static async deleteDoctorAttendance(id: number) {
    const res = await fetch(`${this.apiBaseUrl}/doctor-attendance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete attendance');
    return res.json();
  }

  static async getNextDoctorId() {
    const res = await fetch(`${this.apiBaseUrl}/doctors/next-id`);
    if (!res.ok) throw new Error('Failed to get next doctor ID');
    return res.json();
  }

  // --- STAFF ATTENDANCE CRUD METHODS ---
  static async getAllStaffAttendance(date?: string, staffId?: string) {
    let url = `${this.apiBaseUrl}/staff-attendance`;
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (staffId) params.append('staff_id', staffId);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch staff attendance');
    return res.json();
  }

  static async markStaffAttendance(data: {
    staff_id: string;
    staff_name: string;
    date: string;
    check_in?: string;
    check_out?: string;
    status: 'Present' | 'Absent' | 'Late' | 'Half Day';
    working_hours?: string;
    notes?: string;
  }) {
    const res = await fetch(`${this.apiBaseUrl}/staff-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to mark staff attendance');
    return res.json();
  }

  static async updateStaffAttendance(id: number, data: {
    check_in?: string;
    check_out?: string;
    status?: 'Present' | 'Absent' | 'Late' | 'Half Day';
    working_hours?: string;
    notes?: string;
  }) {
    const res = await fetch(`${this.apiBaseUrl}/staff-attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update staff attendance');
    return res.json();
  }

  static async deleteStaffAttendance(id: number) {
    const res = await fetch(`${this.apiBaseUrl}/staff-attendance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete staff attendance');
    return res.json();
  }

  // --- DOCTOR SALARY PAYMENTS ---
  static async getAllDoctorSalaryPayments() {
    // For now, return empty array since we need to get actual payment data from doctor_salary_settlements
    // This will be used for revenue calculation in dashboard
    try {
      const res = await fetch(`${this.apiBaseUrl}/doctor-salaries/settlements`);
      if (!res.ok) {
        console.warn('Failed to fetch doctor salary settlements, returning empty array');
        return [];
      }
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      console.warn('Error fetching doctor salary payments:', error);
      return [];
    }
  }

  // --- DOCTOR ADVANCES ---
  static async getAllDoctorAdvances() {
    const res = await fetch(`${this.apiBaseUrl}/doctor-advance`);
    if (!res.ok) throw new Error('Failed to fetch doctor advances');
    const result = await res.json();
    return result.data || result; // Handle both wrapped and direct responses
  }
}