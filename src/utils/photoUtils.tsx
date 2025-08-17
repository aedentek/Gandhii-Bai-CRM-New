import React, { useState, useEffect } from 'react';

// Photo URL utility function for robust image handling
export const getPatientPhotoUrl = (photoPath: string): string => {
  // Return empty string for null/undefined/empty paths
  if (!photoPath || photoPath.trim() === '' || photoPath === 'null' || photoPath === 'undefined') {
    return '';
  }
  
  // If it's already a data URL (base64), return as-is
  if (photoPath.startsWith('data:')) {
    return photoPath;
  }
  
  // If it's already a full HTTP URL, return as-is
  if (photoPath.startsWith('http')) {
    return photoPath;
  }
  
  // Handle the CRM photo storage pattern: Photos/patient Admission/{patientId}/
  if (photoPath.includes('Photos/patient Admission/')) {
    // Photo path is already in correct format from database
    return `/${photoPath.replace(/\s/g, '%20')}`;
  }
  
  // Handle backend file paths
  if (photoPath.startsWith('/uploads/')) {
    const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL.replace(/\/api$/, '');
    return baseUrl + photoPath;
  }
  
  // For paths that might be just filenames, try to construct full path
  // This is a fallback - ideally we'd have the patient ID to construct proper path
  if (!photoPath.startsWith('/') && !photoPath.includes('/')) {
    // This is likely just a filename, but we can't construct proper path without patient ID
    // Return as-is and let the image error handling deal with it
    return `/Photos/patient%20Admission/unknown/${photoPath}`;
  }
  
  // For legacy paths without /uploads/ prefix
  const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  return baseUrl + '/uploads/patients' + cleanPath;
};

// Enhanced image component with error handling
export const PatientPhoto = ({ 
  photoPath, 
  alt = 'Patient Photo', 
  className = 'w-12 h-12 rounded-full object-cover',
  showPlaceholder = true 
}: {
  photoPath: string;
  alt?: string;
  className?: string;
  showPlaceholder?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const photoUrl = getPatientPhotoUrl(photoPath);
  
  // Debug logging
  console.log('🔍 PatientPhoto Debug:', {
    photoPath,
    photoUrl,
    isEmpty: !photoPath || photoPath.trim() === '' || photoPath === 'null',
    baseUrl: import.meta.env.VITE_BASE_URL,
    apiUrl: import.meta.env.VITE_API_URL
  });
  
  // Reset error state when photoPath changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [photoPath]);
  
  // If no photo path provided or invalid path
  if (!photoUrl || !photoPath || photoPath.trim() === '' || photoPath === 'null') {
    return showPlaceholder ? (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">No Photo</span>
      </div>
    ) : null;
  }
  
  // If image failed to load, show placeholder quietly
  if (imageError) {
    return showPlaceholder ? (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">No Photo</span>
      </div>
    ) : null;
  }
  
  return (
    <div className="relative">
      <img
        src={photoUrl}
        alt={alt}
        className={className}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          // Silently handle image load errors - don't spam console
          setImageError(true);
        }}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
      {!imageLoaded && !imageError && (
        <div className={`${className} bg-gray-100 flex items-center justify-center animate-pulse`}>
          <span className="text-gray-400 text-xs">...</span>
        </div>
      )}
    </div>
  );
};
