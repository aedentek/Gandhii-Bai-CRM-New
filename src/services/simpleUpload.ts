import { API_CONFIG } from '@/utils/api';

// Move uploaded files from temp to patient-specific folder
export const movePatientFiles = async (patientId: string, tempPaths: { [key: string]: string }): Promise<{ [key: string]: string }> => {
  try {
    console.log('📂 Moving patient files from temp to patient folder:', patientId);
    console.log('📂 Temp paths to move:', tempPaths);

    const response = await fetch('/api/move-patient-files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId: patientId,
        tempPaths: tempPaths
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ File move failed:', response.status, errorText);
      throw new Error(`File move failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Files moved successfully:', result);
    
    return result.newPaths || {};
    
  } catch (error) {
    console.error('❌ Error moving files:', error);
    throw error;
  }
};

// Simplified file upload service without health check
export const uploadPatientFileSimple = async (
  file: File, 
  patientId: string = 'temp', 
  fieldName: string = 'photo'
): Promise<string> => {
  try {
    console.log('📤 Simple upload - Starting file upload...');
    console.log('📤 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit to match validation
      throw new Error('File size exceeds 5MB limit');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('fieldName', fieldName);

    console.log('📤 Uploading to /api/upload-patient-file...');
    
    const response = await fetch('/api/upload-patient-file', {
      method: 'POST',
      body: formData,
    });

    console.log('📤 Upload response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed with status:', response.status);
      console.error('❌ Error response:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    if (!result.filePath) {
      throw new Error('Server did not return a file path');
    }
    
    return result.filePath;
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};
