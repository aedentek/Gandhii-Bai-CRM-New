// File upload service for handling patient document uploads
export class FileUploadService {
  private static baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

  /**
   * Upload a file to the server
   * @param file - The file to upload
   * @param patientId - The patient ID (optional for new patients)
   * @param fieldName - The field name (photo, patientAadhar, etc.)
   * @returns Promise with upload result
   */
  static async uploadFile(file: File, patientId?: string, fieldName?: string): Promise<{
    success: boolean;
    filePath: string;
    filename: string;
    originalName: string;
  }> {
    try {
      console.log('📤 Starting file upload:', { 
        fileName: file.name, 
        fileSize: file.size, 
        patientId, 
        fieldName 
      });

      const formData = new FormData();
      formData.append('file', file);
      
      if (patientId) {
        formData.append('patientId', patientId);
      }
      
      if (fieldName) {
        formData.append('fieldName', fieldName);
      }

      console.log('🌐 Making request to:', `${this.baseUrl}/api/upload-patient-file`);

      const response = await fetch(`${this.baseUrl}/api/upload-patient-file`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary for multipart
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ File uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the server
   * @param filePath - The file path to delete
   * @returns Promise with deletion result
   */
  static async deleteFile(filePath: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete-patient-file`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error(`Deletion failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ File deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get the full URL for a file path
   * @param filePath - The relative file path
   * @returns Full URL to the file
   */
  static getFileUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${this.baseUrl}${filePath}`;
  }

  /**
   * Convert a file to base64 (for backward compatibility)
   * @param file - The file to convert
   * @returns Promise with base64 string
   */
  static convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export default FileUploadService;
