class CallRecordService {
  static baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  static async getAllPatientCallRecords() {
    try {
      const response = await fetch(`${this.baseUrl}/patient-call-records`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch call records: ${error}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching call records:', error);
      throw error;
    }
  }

  static async addPatientCallRecord(data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/patient-call-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add call record');
      return await response.json();
    } catch (error) {
      console.error('Error adding call record:', error);
      throw error;
    }
  }

  static async updatePatientCallRecord(id: string, data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/patient-call-records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update call record');
      return await response.json();
    } catch (error) {
      console.error('Error updating call record:', error);
      throw error;
    }
  }

  static async deletePatientCallRecord(id: string): Promise<boolean> {
    try {
      console.log('🗑️ CallRecordService: Attempting to delete record ID:', id);
      console.log('🔗 CallRecordService: Delete URL:', `${this.baseUrl}/patient-call-records/${id}`);
      
      const response = await fetch(`${this.baseUrl}/patient-call-records/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('📡 CallRecordService: Response status:', response.status);
      console.log('📡 CallRecordService: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ CallRecordService: Error response:', errorText);
        throw new Error(`Failed to delete call record: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ CallRecordService: Delete successful:', result);
      return true;
    } catch (error) {
      console.error('❌ CallRecordService: Error deleting call record:', error);
      throw error;
    }
  }
}

export default CallRecordService;
