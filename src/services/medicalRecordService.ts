class MedicalRecordService {
  static baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  static async getAllPatientMedicalRecords() {
    try {
      const response = await fetch(`${this.baseUrl}/patient-medical-records`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch medical records: ${error}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  }

  static async addPatientMedicalRecord(data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/patient-medical-records/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add medical record');
      return await response.json();
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw error;
    }
  }

  static async updatePatientMedicalRecord(id: string, data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/patient-medical-records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update medical record');
      return await response.json();
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  }

  static async deletePatientMedicalRecord(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/patient-medical-records/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete medical record');
      return await response.json();
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  }
}

export default MedicalRecordService;
