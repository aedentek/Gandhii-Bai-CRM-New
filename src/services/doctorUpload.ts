import { API_CONFIG } from '@/utils/api';

// Doctor file upload service
export const uploadDoctorFile = async (
  file: File, 
  doctorId: string = 'new', 
  fieldName: string = 'photo'
): Promise<string> => {
  try {
    console.log('📤 Doctor upload - Starting file upload...');
    console.log('📤 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size exceeds 5MB limit');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctorId', doctorId);
    formData.append('fieldName', fieldName);

    console.log('📤 Uploading to /api/upload-doctor-file...');
    
    const response = await fetch('/api/upload-doctor-file', {
      method: 'POST',
      body: formData,
    });

    console.log('📤 Doctor upload response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Doctor upload failed with status:', response.status);
      console.error('❌ Error response:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Doctor upload successful:', result);
    
    if (!result.filePath) {
      throw new Error('Server did not return a file path');
    }
    
    return result.filePath;
    
  } catch (error) {
    console.error('❌ Doctor upload error:', error);
    throw error;
  }
};

// Get doctor file URL
export const getDoctorFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // Handle both absolute and relative paths
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  return `/Photos/${cleanPath}`;
};
