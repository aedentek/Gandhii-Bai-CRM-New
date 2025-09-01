import { DatabaseService } from './databaseService';

export class PatientService {
  /**
   * Get all patients with their media/photo information
   */
  static async getAllPatientsWithMedia() {
    try {
      const patients = await DatabaseService.getAllPatients();
      
      // Add media information for each patient
      const patientsWithMedia = patients.map((patient: any) => {
        let photoUrl = null;
        if (patient.photo) {
          // For static files served by Express, prepend the base URL + the path
          // Server serves static files from /Photos route
          photoUrl = `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${patient.photo}`;
        }
        
        return {
          ...patient,
          photo: patient.photo || null,
          hasPhoto: !!patient.photo,
          photoUrl: photoUrl,
        };
      });

      // Debug logging
      console.log('🔍 Patient photo debug:', patientsWithMedia.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        photoUrl: p.photoUrl
      })));

      return patientsWithMedia;
    } catch (error) {
      console.error('Error fetching patients with media:', error);
      throw error;
    }
  }

  /**
   * Get a single patient with media information
   */
  static async getPatientWithMedia(id: string | number) {
    try {
      const patient = await DatabaseService.getPatient(id);
      
      return {
        ...patient,
        photo: patient.photo || null,
        hasPhoto: !!patient.photo,
        photoUrl: patient.photo ? `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}/${patient.photo}` : null,
      };
    } catch (error) {
      console.error('Error fetching patient with media:', error);
      throw error;
    }
  }

  /**
   * Add a new patient
   */
  static async addPatient(patientData: any) {
    try {
      return await DatabaseService.addPatient(patientData);
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  }

  /**
   * Update patient information
   */
  static async updatePatient(id: string | number, patientData: any) {
    try {
      return await DatabaseService.updatePatient(id, patientData);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * Delete a patient
   */
  static async deletePatient(id: string | number) {
    try {
      return await DatabaseService.deletePatient(id);
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  /**
   * Search patients by name, ID, or other criteria
   */
  static async searchPatients(searchTerm: string) {
    try {
      const patients = await this.getAllPatientsWithMedia();
      
      if (!searchTerm) return patients;
      
      const lowercaseSearch = searchTerm.toLowerCase();
      return patients.filter((patient: any) => 
        patient.name?.toLowerCase().includes(lowercaseSearch) ||
        patient.id?.toLowerCase().includes(lowercaseSearch) ||
        patient.email?.toLowerCase().includes(lowercaseSearch) ||
        patient.phone?.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  /**
   * Get patients by status
   */
  static async getPatientsByStatus(status: string) {
    try {
      const patients = await this.getAllPatientsWithMedia();
      return patients.filter((patient: any) => patient.status === status);
    } catch (error) {
      console.error('Error fetching patients by status:', error);
      throw error;
    }
  }
}
