// Doctor file upload service
export const uploadDoctorFile = async (
  file: File, 
  doctorId: string = 'new', 
  fieldName: string = 'photo'
): Promise<string> => {
  try {
    console.log('📤 Starting doctor file upload...');
    console.log('📤 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    console.log('📤 Upload params:', { doctorId, fieldName });
    
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
    formData.append('doctorId', doctorId);
    formData.append('fieldName', fieldName);

    console.log('📤 FormData contents:');
    console.log('📤 - file:', file.name, file.size, 'bytes');
    console.log('📤 - doctorId:', doctorId, 'type:', typeof doctorId);
    console.log('📤 - fieldName:', fieldName);

    // Use dedicated doctor upload endpoint
    const uploadUrl = '/api/upload-doctor-file';
    
    console.log('📤 Sending upload request to backend...');
    console.log('📤 Request URL:', uploadUrl);
    console.log('📤 FormData contents:', {
      file: file.name,
      doctorId: doctorId,
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
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    // Return the file path for database storage
    return result.filePath;
    
  } catch (error) {
    console.error('❌ Doctor file upload error:', error);
    throw error;
  }
};

// Helper function to upload multiple doctor files
export const uploadMultipleDoctorFiles = async (
  files: Record<string, File | null>,
  doctorId: string
): Promise<Record<string, string>> => {
  const uploadedPaths: Record<string, string> = {};
  
  console.log('📤 Starting multiple doctor file uploads...');
  console.log('📤 Files to upload:', Object.keys(files).filter(key => files[key] !== null));
  
  for (const [fieldName, file] of Object.entries(files)) {
    if (file) {
      try {
        console.log(`📤 Uploading ${fieldName}:`, file.name);
        const filePath = await uploadDoctorFile(file, doctorId, fieldName);
        uploadedPaths[fieldName] = filePath;
        console.log(`✅ ${fieldName} uploaded successfully:`, filePath);
      } catch (error) {
        console.error(`❌ Failed to upload ${fieldName}:`, error);
        throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
      }
    }
  }
  
  console.log('✅ All doctor files uploaded successfully:', uploadedPaths);
  return uploadedPaths;
};

// Doctor ID generation utilities
export const generateDoctorId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DOC${timestamp.slice(-6)}${random}`;
};

export const preGenerateDoctorId = (): string => {
  const id = generateDoctorId();
  console.log('🆔 Pre-generated doctor ID:', id);
  return id;
};
