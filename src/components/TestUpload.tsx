import React, { useState } from 'react';
import { uploadPatientFile } from '@/services/simpleFileUpload';

const TestUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleTest = async () => {
    if (!file) {
      setResult('Please select a file first');
      return;
    }

    setUploading(true);
    setResult('Uploading...');

    try {
      console.log('🧪 Testing upload with file:', file.name);
      const filePath = await uploadPatientFile(file, 'P0001', 'photo');
      setResult(`✅ Upload successful! File path: ${filePath}`);
      console.log('🧪 Test upload successful:', filePath);
    } catch (error) {
      console.error('🧪 Test upload failed:', error);
      setResult(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #ccc', margin: '20px' }}>
      <h3>Upload Test Component</h3>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept="image/*"
      />
      <button 
        onClick={handleTest} 
        disabled={uploading || !file}
        style={{ margin: '10px', padding: '10px' }}
      >
        {uploading ? 'Uploading...' : 'Test Upload'}
      </button>
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        Result: {result}
      </div>
    </div>
  );
};

export default TestUpload;
