// Simple file upload for medical history
export const uploadMedicalHistoryFile = async (
  file: File, 
  patientId: string, 
  fileType: 'document' | 'audio' = 'document'
): Promise<string> => {
  console.log(`📤 Uploading ${fileType}:`, file.name, 'Size:', file.size);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);
  formData.append('fileType', fileType);

  const response = await fetch('/api/upload-medical-history-file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Upload successful:', result.filePath);
  return result.filePath;
};

// Upload for patient history documents (saves to Patient Doctor Record folder)
export const uploadPatientHistoryFile = async (
  file: File, 
  patientId: string, 
  fileType: 'document' | 'audio' = 'document'
): Promise<string> => {
  console.log(`📤 Uploading patient history ${fileType}:`, file.name, 'Size:', file.size);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);
  formData.append('fileType', fileType);

  const response = await fetch('/api/upload-patient-history-file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Patient history upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Patient history upload successful:', result.filePath);
  return result.filePath;
};

// Upload for call record audio files (saves to Patient Call Records folder)
export const uploadCallRecordAudio = async (
  file: File, 
  patientId: string
): Promise<string> => {
  console.log(`📤 Uploading call record audio:`, file.name, 'Size:', file.size);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);

  const response = await fetch('/api/upload-call-record-audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Call record audio upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Call record audio upload successful:', result.filePath);
  return result.filePath;
};

export const uploadPatientFile = async (
  file: File, 
  patientId: string = 'temp', 
  fieldName: string = 'photo'
): Promise<string> => {
  try {
    console.log('📤 Starting file upload...');
    console.log('📤 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    console.log('📤 Upload params:', { patientId, fieldName });
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit');
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Test backend connectivity first
    try {
      console.log('🔍 Testing backend connectivity through proxy...');
      const healthResponse = await fetch('/api/health', { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      console.log('🔍 Health check response:', healthResponse.status, healthResponse.statusText);
      if (!healthResponse.ok) {
        console.log('🔍 Trying direct backend connection...');
        const directHealthResponse = await fetch(`${import.meta.env.VITE_API_URL}/health`, { method: 'GET' });
        if (!directHealthResponse.ok) {
          throw new Error(`Backend server is not responding. Proxy: ${healthResponse.status}, Direct: ${directHealthResponse.status}`);
        }
        console.log('✅ Direct backend connection works, but proxy might be misconfigured');
      }
      const healthData = await healthResponse.text();
      console.log('✅ Backend server is healthy:', healthData);
    } catch (healthError) {
      console.error('❌ Backend health check failed:', healthError);
      throw new Error(`Cannot connect to backend server. Please make sure the backend server is running on http://localhost:4000 and the proxy is configured correctly. Error: ${healthError.message}`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('fieldName', fieldName);

    // Use relative URL - proxy will route to backend
    const uploadUrl = '/api/upload-patient-file';
    
    console.log('📤 Sending upload request to backend...');
    console.log('📤 Request URL:', uploadUrl);
    console.log('📤 FormData contents:', {
      file: file.name,
      patientId: patientId,
      fieldName: fieldName
    });
    
    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      clearTimeout(timeoutId);

      console.log('📤 Upload response status:', response.status);
      console.log('📤 Upload response statusText:', response.statusText);
      console.log('📤 Upload response URL:', response.url);
      console.log('📤 Upload response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed with status:', response.status);
        console.error('❌ Error response:', errorText);
        
        if (response.status === 404) {
          throw new Error('Upload endpoint not found. Please make sure the backend server is running with the correct API endpoints.');
        } else if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        } else {
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
      
      if (!result.filePath) {
        throw new Error('Upload succeeded but no file path returned');
      }
      
      return result.filePath;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout - please check your connection and try again');
      } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('fetch')) {
        throw new Error('Network error - cannot reach server. Please check if both frontend (port 8080) and backend (port 4000) servers are running.');
      } else if (fetchError.message.includes('CORS')) {
        throw new Error('CORS error - there may be a proxy configuration issue. Please check your Vite configuration.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    if (error instanceof Error) {
      throw new Error(`File upload failed: ${error.message}`);
    } else {
      throw new Error('File upload failed: Unknown error');
    }
  }
};

export const getFileUrl = (filePath: string): string => {
  console.log('🔗 getFileUrl called with:', filePath);
  
  if (!filePath || filePath.trim() === '') {
    console.log('🔗 Empty filePath, returning empty string');
    return '';
  }
  if (filePath.startsWith('http')) {
    console.log('🔗 Already full URL, returning as-is:', filePath);
    return filePath;
  }
  if (filePath.startsWith('data:')) {
    console.log('🔗 Data URL, returning as-is');
    return filePath;
  }
  
  // Clean the file path and construct the backend URL
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  let fullUrl: string;
  
  if (cleanPath.startsWith('/uploads/')) {
    // Path already includes /uploads/ (for both patients and medical-history)
    fullUrl = `http://localhost:4000${cleanPath}`;
  } else if (cleanPath.startsWith('/Photos/')) {
    // Photos directory (Patient History, Patient Medical Records, etc.)
    fullUrl = `http://localhost:4000${cleanPath}`;
  } else {
    // Add the uploads/patients/ prefix for legacy patient files
    fullUrl = `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/uploads/patients${cleanPath}`;
  }
  
  console.log('🔗 Constructed backend URL:', fullUrl);
  return fullUrl;
};

export const deletePatientFile = async (filePath: string): Promise<void> => {
  try {
    const response = await fetch('/api/delete-patient-file', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    // Don't throw - deletion errors are not critical
  }
};
