// Staff file upload service
export const uploadStaffFile = async (
  file: File, 
  staffId: string = 'new', 
  fieldName: string = 'photo'
): Promise<string> => {
  try {
    console.log('📤 Starting staff file upload...');
    console.log('📤 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    console.log('📤 Upload params:', { staffId, fieldName });
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit');
    }
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
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
      throw new Error(`Cannot connect to backend server. Please make sure the backend server is running on port ${import.meta.env.VITE_API_URL} and the proxy is configured correctly. Error: ${healthError.message}`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('staffId', staffId);
    formData.append('fieldName', fieldName);

    // Use dedicated staff upload endpoint
    const uploadUrl = '/api/upload-staff-file';
    
    console.log('📤 Sending upload request to backend...');
    console.log('📤 Request URL:', uploadUrl);
    console.log('📤 FormData contents:', {
      file: file.name,
      staffId: staffId,
      fieldName: fieldName
    });
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Upload response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        console.error('❌ Upload failed - Error data:', errorData);
      } catch {
        errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        console.error('❌ Upload failed - Could not parse error response');
      }
      throw new Error(`Upload failed: ${errorMessage}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    if (!result.filePath) {
      throw new Error('Upload succeeded but no file path returned');
    }
    
    return result.filePath;
  } catch (error) {
    console.error('❌ Staff file upload error:', error);
    throw error;
  }
};

export const getStaffFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If it's a base64 string, return as is
  if (filePath.startsWith('data:image/')) {
    return filePath;
  }
  
  // If it starts with /Photos, use proxy
  if (filePath.startsWith('/Photos')) {
    return filePath;
  }
  
  // If it starts with /uploads, use proxy (legacy support)
  if (filePath.startsWith('/uploads')) {
    return filePath;
  }
  
  // Otherwise, construct the full URL using environment variable
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};
