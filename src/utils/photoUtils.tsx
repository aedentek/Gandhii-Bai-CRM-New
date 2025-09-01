import React, { useState, useEffect, useMemo } from 'react';

// Photo URL utility function for robust image handling
export const getPatientPhotoUrl = (photoPath: string): string => {
  // Return empty string for null/undefined/empty paths
  if (!photoPath || photoPath.trim() === '' || photoPath === 'null' || photoPath === null || photoPath === undefined) {
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
  
  // Clean the path - convert ALL backslashes to forward slashes and normalize
  let cleanPath = photoPath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
  cleanPath = cleanPath.replace(/\/+/g, '/'); // Replace multiple slashes with single slash
  
  // Fix duplicated Photos/ prefix issue - if path has "Photos/Photos/", remove the duplicate
  if (cleanPath.includes('Photos/Photos/')) {
    console.log('⚠️ Detected duplicated Photos/ prefix in path:', cleanPath);
    cleanPath = cleanPath.replace('Photos/Photos/', 'Photos/');
    console.log('✅ Fixed duplicated Photos/ prefix to:', cleanPath);
  }
  
  // Ensure path starts with Photos/ for consistency (only if it doesn't already have it)
  if (!cleanPath.startsWith('Photos/') && !cleanPath.startsWith('/Photos/')) {
    // If path doesn't start with Photos/, add it
    if (cleanPath.startsWith('/')) {
      cleanPath = `Photos${cleanPath}`;
    } else {
      cleanPath = `Photos/${cleanPath}`;
    }
  }
  
  // If path already starts with Photos/, construct full URL to backend
  if (cleanPath.startsWith('Photos/')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
    // Add aggressive cache buster to force reload with timestamp and random value
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cacheBuster = `?t=${timestamp}&r=${random}`;
    return `${baseUrl}/${cleanPath.replace(/\s/g, '%20')}${cacheBuster}`;
  }
  
  // If path starts with /Photos/, construct full URL to backend  
  if (cleanPath.startsWith('/Photos/')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cacheBuster = `?t=${timestamp}&r=${random}`;
    return `${baseUrl}${cleanPath.replace(/\s/g, '%20')}${cacheBuster}`;
  }
  
  // Handle backend file paths
  if (cleanPath.startsWith('/uploads/')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cacheBuster = `?t=${timestamp}&r=${random}`;
    return `${baseUrl}${cleanPath}${cacheBuster}`;
  }
  
  // For paths that are just filenames or don't match our patterns
  // This is a fallback - try to serve from backend
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const cacheBuster = `?t=${timestamp}&r=${random}`;
  return `${baseUrl}${cleanPath}${cacheBuster}`;
};

// Enhanced image component with error handling and forced refresh capability
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Force refresh when photoPath changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setRefreshKey(prev => prev + 1);
    setRetryCount(0);
  }, [photoPath]);
  
  // Generate photo URL with aggressive cache busting
  const photoUrl = useMemo(() => {
    if (!photoPath || photoPath.trim() === '' || photoPath === 'null') {
      return '';
    }
    
    const baseUrl = getPatientPhotoUrl(photoPath);
    if (!baseUrl) return '';
    
    // Add extra cache busting parameters with more aggressive randomization
    const url = new URL(baseUrl);
    url.searchParams.set('refresh', refreshKey.toString());
    url.searchParams.set('path', encodeURIComponent(photoPath));
    url.searchParams.set('retry', retryCount.toString());
    // Add current timestamp for more cache busting
    url.searchParams.set('ts', Date.now().toString());
    return url.toString();
  }, [photoPath, refreshKey, retryCount]);
  
  // Debug logging - enhanced
  console.log('🔍 PatientPhoto Debug:', {
    photoPath,
    photoUrl,
    refreshKey,
    retryCount,
    isEmpty: !photoPath || photoPath.trim() === '' || photoPath === 'null' || photoPath === null || photoPath === undefined,
    isNull: photoPath === null,
    isUndefined: photoPath === undefined,
    isStringNull: photoPath === 'null',
    isEmptyString: photoPath === '',
    timestamp: Date.now()
  });
  
  // Additional validation
  if (photoPath && photoPath.includes('Photos/patient Admission/')) {
    console.log('✅ Valid patient photo path detected:', photoPath);
    console.log('🔗 Final constructed URL:', photoUrl);
  } else if (photoPath) {
    console.log('⚠️ Unexpected photo path format:', photoPath);
  }
  
  // Reset error state when photoPath changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [photoPath]);
  
  // If no photo path provided or invalid path
  if (!photoUrl || !photoPath || photoPath.trim() === '' || photoPath === 'null' || photoPath === null || photoPath === undefined) {
    return showPlaceholder ? (
      <div 
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ 
          borderRadius: className.includes('rounded-full') ? '50%' : undefined 
        }}
      >
        <span className="text-gray-400 text-xs">No Photo</span>
      </div>
    ) : null;
  }
  
  // If image failed to load, show placeholder but allow retry
  if (imageError && retryCount >= 3) {
    return showPlaceholder ? (
      <div 
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ 
          borderRadius: className.includes('rounded-full') ? '50%' : undefined 
        }}
      >
        <span className="text-gray-400 text-xs">No Photo</span>
      </div>
    ) : null;
  }
  
  return (
    <div className="relative">
      <img
        key={`${photoPath}-${refreshKey}-${retryCount}`}
        src={photoUrl}
        alt={alt}
        className={className}
        style={{ 
          display: imageLoaded ? 'block' : 'none',
          borderRadius: className.includes('rounded-full') ? '50%' : undefined
        }}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', photoUrl);
          setImageLoaded(true);
          setImageError(false);
        }}
        onError={(e) => {
          console.error('❌ Image failed to load:', photoUrl);
          console.error('❌ Error details:', {
            photoPath,
            photoUrl,
            refreshKey,
            retryCount,
            naturalWidth: (e.target as HTMLImageElement).naturalWidth,
            naturalHeight: (e.target as HTMLImageElement).naturalHeight
          });
          
          // Retry loading up to 3 times with increasing delay
          if (retryCount < 3) {
            const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s delay
            setTimeout(() => {
              console.log(`🔄 Retrying image load (attempt ${retryCount + 1}):`, photoUrl);
              setRetryCount(prev => prev + 1);
            }, delay);
          } else {
            setImageError(true);
          }
        }}
      />
      {!imageLoaded && !imageError && (
        <div 
          className={`${className} bg-gray-100 flex items-center justify-center animate-pulse`}
          style={{ 
            borderRadius: className.includes('rounded-full') ? '50%' : undefined 
          }}
        >
          <span className="text-gray-400 text-xs">...</span>
        </div>
      )}
    </div>
  );
};
