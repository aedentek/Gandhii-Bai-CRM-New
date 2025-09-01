import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { patientsAPI } from '@/utils/api';
import { uploadPatientFile, deletePatientFile } from '@/services/simpleFileUpload';
import { getPatientPhotoUrl, PatientPhoto } from '@/utils/photoUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, Edit2, Trash2, Users, Plus, Filter, Download, FileText, Upload, RefreshCw, RefreshCcw, UserCheck, Activity, TrendingUp, Clock, X, Camera, Calendar, CreditCard, Heart, Shield, User, Phone, MapPin, Contact } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import usePageTitle from '@/hooks/usePageTitle';
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '@/styles/global-crm-design.css';
import '@/styles/global-crm-design.css';

// Utility function to create timezone-safe dates
const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
};

// Utility function to format date for backend (DD-MM-YYYY)
const formatDateForBackend = (date: Date | null): string => {
  if (!date) return '';
  
  // Handle Date objects directly
  if (date instanceof Date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) return '';
    
    return format(date, 'dd-MM-yyyy');
  }
  
  return '';
};

// Utility function to format date for HTML input (YYYY-MM-DD)
const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  
  // Handle both Date objects and date strings
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  // Check if year is reasonable
  const year = dateObj.getFullYear();
  if (year < 1900 || year > 2100) return '';
  
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to parse HTML input date (YYYY-MM-DD) to local Date
const parseDateFromInput = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Validate the numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    const date = createLocalDate(year, month, day);
    
    // Double-check the created date is valid
    if (isNaN(date.getTime())) return null;
    
    return date;
  } catch (error) {
    console.warn('Error parsing date from input:', dateString, error);
    return null;
  }
};

// Utility function to calculate age from date of birth
const calculateAge = (dateOfBirth: Date | null): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract 1 from age
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure age is never negative
};

interface Patient {
  id: string;            // This will be in P0001 format
  originalId: number;    // Store original database auto-increment ID
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string;
  admissionDate: Date;
  status: string;
  attenderName: string;
  attenderPhone: string;
  photo: string;
  fees: number;
  bloodTest: number;
  pickupCharge: number;
  totalAmount: number;
  payAmount: number;
  balance: number;
  paymentType: string;
  fatherName: string;
  motherName: string;
  attenderRelationship: string;
  dateOfBirth: Date;
  marriageStatus: string;
  employeeStatus: string;
  // Document fields
  patientAadhar?: string;
  patientPan?: string;
  attenderAadhar?: string;
  attenderPan?: string;
}

interface FileUploadFieldProps {
  label: string;
  currentFile?: string;
  uploadedFile?: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  currentFile,
  uploadedFile,
  onFileChange,
  accept = "image/*"
}) => {
  const fileInputId = `file-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fileInputId}>{label}</Label>
      
      {/* Current Image Preview */}
      {currentFile && currentFile.trim() !== '' && !uploadedFile && (
        <div className="relative">
          <img 
            src={currentFile.startsWith('data:') ? currentFile : getPatientPhotoUrl(currentFile)}
            alt={label}
            className="w-full h-32 object-cover rounded-md border"
            onError={(e) => {
              console.error('❌ Failed to load image in FileUploadField:', currentFile);
              console.error('❌ Constructed URL:', currentFile.startsWith('data:') ? 'data URL' : getPatientPhotoUrl(currentFile));
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully in FileUploadField:', currentFile);
            }}
          />
          <div className="text-xs text-muted-foreground mt-1">Current {label}</div>
        </div>
      )}
      
      {/* File Upload */}
      <div className="flex items-center space-x-2">
        <Input
          id={fileInputId}
          type="file"
          accept={accept}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Label
          htmlFor={fileInputId}
          className="flex items-center space-x-2 cursor-pointer bg-muted hover:bg-muted/80 px-3 py-2 rounded-md border border-input transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>{uploadedFile ? uploadedFile.name : `Upload ${label}`}</span>
        </Label>
        {uploadedFile && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFileChange(null)}
          >
            Remove
          </Button>
        )}
      </div>
      
      {/* New File Preview */}
      {uploadedFile && (
        <div className="relative">
          <img 
            src={URL.createObjectURL(uploadedFile)}
            alt={`New ${label}`}
            className="w-full h-32 object-cover rounded-md border"
          />
          <div className="text-xs text-muted-foreground mt-1">New {label} (will be saved on update)</div>
        </div>
      )}
    </div>
  );
};

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle();
  
  // Month/year constants
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Month/Year filter states
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // State for tracking preview URLs to avoid memory leaks
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});
  
  // State to force photo refresh after updates
  const [photoRefreshTrigger, setPhotoRefreshTrigger] = useState(0);
  
  // Cleanup preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      // Cleanup all preview URLs on unmount
      Object.values(previewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);
  
  // Helper function to get or create preview URL
  const getPreviewUrl = (file: File, key: string): string => {
    if (previewUrls[key]) {
      return previewUrls[key];
    }
    
    const url = URL.createObjectURL(file);
    setPreviewUrls(prev => ({ ...prev, [key]: url }));
    return url;
  };
  
  // File size validation function (5MB limit) for edit form
  const validateEditFileSize = (file: File | null): boolean => {
    if (!file) return true; // Allow null files
    
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB in bytes
    
    if (file.size > maxSizeInBytes) {
      toast({
        title: "File Too Large",
        description: `File size must be less than 5MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Document upload state for edit form
  const [editDocuments, setEditDocuments] = useState({
    photo: null as File | null,
    patientAadhar: null as File | null,
    patientPan: null as File | null,
    attenderAadhar: null as File | null,
    attenderPan: null as File | null
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    loadPatients();
  }, []);

  // Refresh data when window gains focus (user returns from another tab/page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing patient data...');
      loadPatients();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Refresh data every 30 seconds to catch any updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing patient data...');
      loadPatients();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterPatients();
    setCurrentPage(1); // Reset to first page on filter/search change
  }, [patients, searchTerm, statusFilter, filterMonth, filterYear]);

  // Removed auto-navigation to ensure page always starts at 1

  // Function to format patient ID as P0001
  const formatPatientId = (id: number): string => {
    return `P${id.toString().padStart(4, '0')}`;
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      console.log('🔗 Loading patients via unified API...');
      // Try unified API first, fall back to DatabaseService if needed
      let data;
      try {
        data = await patientsAPI.getAll();
        console.log('✅ Patients loaded via unified API:', data.length, 'patients');
      } catch (apiError) {
        console.warn('⚠️ Unified API failed, falling back to DatabaseService:', apiError.message);
        data = await DatabaseService.getAllPatients();
        console.log('✅ Patients loaded via DatabaseService:', data.length, 'patients');
      }
      
      console.log('📋 Raw patient data from database:', data);
      
      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Invalid patient data received:', data);
        setPatients([]);
        toast({
          title: "Warning",
          description: "No patient data received from server",
          variant: "destructive"
        });
        return;
      }

      const parsedPatients = data.map((p: any) => {
        // Debug: Log patient data to see what format dates are in
        if (p.id === 102 || p.id === 103) { // Debug first few patients
          console.log(`🔍 DEBUG Patient ${p.id}:`, {
            name: p.name,
            admissionDate: p.admissionDate,
            dateOfBirth: p.dateOfBirth,
            admissionDateType: typeof p.admissionDate,
            dateOfBirthType: typeof p.dateOfBirth
          });
        }
        
        // Function to parse DD-MM-YYYY format from backend to Date object
        const parseDateFromDDMMYYYY = (dateStr: any): Date | null => {
          if (!dateStr) return null; // Return null for empty dates
          
          // If it's already a Date object, validate it first
          if (dateStr instanceof Date) {
            // Check if the date is valid and has a reasonable year
            if (isNaN(dateStr.getTime())) return null;
            const year = dateStr.getFullYear();
            if (year < 1900 || year > 2100) {
              // This handles the 1899 default dates from database
              return null;
            }
            return dateStr;
          }
          
          // If it's in DD-MM-YYYY format
          if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = dateStr.split('-');
            const parsedYear = parseInt(year);
            
          // Reject clearly invalid years
          if (parsedYear < 1900 || parsedYear > 2100) {
            return null;
          }            
            return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
          }
          
          // If it's in YYYY-MM-DD format, parse safely in local timezone
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const [year, month, day] = dateStr.split('-');
            const parsedYear = parseInt(year);
            
            // Reject clearly invalid years
            if (parsedYear < 1900 || parsedYear > 2100) {
              console.warn(`⚠️ Invalid year detected: ${parsedYear}, setting to null`);
              return null; // Return null instead of fallback date
            }
            
            return new Date(parsedYear, parseInt(month) - 1, parseInt(day));
          }
          
          // Try to parse as regular date but ensure local timezone
          try {
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) return null;
            
            // Check if the parsed year is reasonable
            const year = parsed.getFullYear();
            if (year < 1900 || year > 2100) {
              console.warn(`⚠️ Invalid year detected in parsed date: ${year}, using current date instead`);
              return new Date(); // Use current date as fallback
            }
            
            // If it seems to be a UTC date, convert to local timezone
            if (typeof dateStr === 'string' && dateStr.includes('T')) {
              const localDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
              return localDate;
            }
            
            return parsed;
          } catch {
            return null;
          }
        };
        
        // Use the ID directly from backend (already in P0001 format)
        const patientId = p.id && String(p.id).startsWith('P') 
          ? p.id 
          : `P${(p.originalId || p.id || 1).toString().padStart(4, '0')}`;
        const numericId = p.originalId || parseInt(String(p.id || patientId).replace(/\D/g, '')) || 1;
        
        // Log individual patient payment data for debugging
        console.log(`Patient ${p.name} payment data:`, {
          fees: p.fees,
          bloodTest: p.bloodTest,
          pickupCharge: p.pickupCharge,
          totalAmount: p.totalAmount,
          payAmount: p.payAmount,
          balance: p.balance,
          paymentType: p.paymentType
        });
        
        const fees = parseFloat(p.fees) || 0;
        const bloodTest = parseFloat(p.bloodTest) || 0;
        const pickupCharge = parseFloat(p.pickupCharge) || 0;
        const payAmount = parseFloat(p.payAmount) || 0;
        
        // Calculate total amount and balance
        const totalAmount = fees + bloodTest + pickupCharge;
        const balance = totalAmount - payAmount;
        
        return {
          id: patientId,                    // Already formatted as P0001 from backend
          originalId: numericId,            // Numeric ID for database operations
          name: p.name,
          age: parseInt(p.age) || 0,
          gender: p.gender,
          phone: p.phone,
          email: p.email || '',
          address: p.address,
          emergencyContact: p.emergencyContact || '',
          medicalHistory: p.medicalHistory || '',
          admissionDate: parseDateFromDDMMYYYY(p.admissionDate), // Parse DD-MM-YYYY format
          status: p.status || 'Active',
          attenderName: p.attenderName || '',
          attenderPhone: p.attenderPhone || '',
          photo: p.photo || '',
          fees: fees,
          bloodTest: bloodTest,
          pickupCharge: pickupCharge,
          totalAmount: totalAmount,
          payAmount: payAmount,
          balance: balance,
          paymentType: p.paymentType || '',
          fatherName: p.fatherName || '',
          motherName: p.motherName || '',
          attenderRelationship: p.attenderRelationship || '',
          dateOfBirth: parseDateFromDDMMYYYY(p.dateOfBirth), // Parse DD-MM-YYYY format
          marriageStatus: p.marriageStatus || '',
          employeeStatus: p.employeeStatus || '',
          // Document fields with debugging
          patientAadhar: p.patientAadhar || '',
          patientPan: p.patientPan || '',
          attenderAadhar: p.attenderAadhar || '',
          attenderPan: p.attenderPan || ''
        };
      });
      
      // Debug: Log document data for each patient
      parsedPatients.forEach(patient => {
        if (patient.photo) {
          console.log(`📸 Patient ${patient.name} (${patient.id}) photo:`, patient.photo);
          console.log(`📸 Constructed URL:`, getPatientPhotoUrl(patient.photo));
        }
        if (patient.patientAadhar || patient.patientPan || patient.attenderAadhar || patient.attenderPan) {
          console.log(`📄 Patient ${patient.name} documents:`, {
            patientAadhar: patient.patientAadhar,
            patientPan: patient.patientPan,
            attenderAadhar: patient.attenderAadhar,
            attenderPan: patient.attenderPan
          });
        }
      });
      setPatients(parsedPatients);
      setCurrentPage(1); // Always reset to first page when loading patients
      } catch (error) {
        console.error('❌ Error loading patients:', error);
        setPatients([]);
        toast({
          title: "Error",
          description: `Failed to load patients: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };  const filterPatients = () => {
    let filtered = [...patients]; // Create a copy to sort

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(patient.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone || '').includes(searchTerm)
      );
    }

    // Status filtering - show all patients if "All" is selected, otherwise filter by specific status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    // Remove month/year filtering by admission date - show all patients regardless of joining date
    // The month/year picker is now only for reference/organization, not filtering
    /* 
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(patient => {
        if (!patient.admissionDate) return false;
        const admissionDate = new Date(patient.admissionDate);
        return admissionDate.getMonth() === (filterMonth - 1) && admissionDate.getFullYear() === filterYear;
      });
    }
    */

    // Sort by Patient ID (P0001 format)
    filtered.sort((a, b) => {
      // Extract numeric portion from ID (e.g., "0001" from "P0001")
      // Ensure ID is a string before using substring
      const aId = String(a.id || '');
      const bId = String(b.id || '');
      const aNum = parseInt(aId.substring(1)) || 0;
      const bNum = parseInt(bId.substring(1)) || 0;
      return aNum - bNum;
    });

    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page on filter
  };

  // Convert file to base64 for storage
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle document file upload in edit form
  const handleEditFileUpload = (field: keyof typeof editDocuments, file: File | null) => {
    console.log('🔄 handleEditFileUpload called:', { field, file: file ? { name: file.name, size: file.size } : null });
    
    // Validate file size before processing
    if (!validateEditFileSize(file)) {
      console.log('❌ File size validation failed');
      return; // Don't update state if file is too large
    }

    console.log('✅ File size validation passed, updating editDocuments state');
    setEditDocuments(prev => {
      const newState = {
        ...prev,
        [field]: file
      };
      console.log('📋 Updated editDocuments state:', newState);
      return newState;
    });

    if (file) {
      console.log('📎 File selected successfully:', file.name);
      toast({
        title: "File Selected",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB) selected successfully`,
      });
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditPatient({ ...patient });
    // Reset edit documents
    setEditDocuments({
      photo: null,
      patientAadhar: null,
      patientPan: null,
      attenderAadhar: null,
      attenderPan: null
    });
  };

  const handleSaveEdit = async () => {
    if (!editPatient) return;
    
    try {
      // Comprehensive validation for edit form (mirroring AddPatient validation)
      
      // Validate required fields
      if (!editPatient.name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Patient name is required.",
          variant: "destructive",
        });
        return;
      }

      if (!editPatient.age || editPatient.age <= 0) {
        toast({
          title: "Validation Error",
          description: "Valid age is required.",
          variant: "destructive",
        });
        return;
      }

      if (!editPatient.gender?.trim()) {
        toast({
          title: "Validation Error",
          description: "Gender is required.",
          variant: "destructive",
        });
        return;
      }

      if (!editPatient.phone?.trim()) {
        toast({
          title: "Validation Error",
          description: "Phone number is required.",
          variant: "destructive",
        });
        return;
      }

      // Phone number validation - should be exactly 10 digits
      const phoneNumber = editPatient.phone.replace(/\D/g, '');
      if (phoneNumber.length !== 10) {
        toast({
          title: "Validation Error",
          description: "Phone number must be exactly 10 digits.",
          variant: "destructive",
        });
        return;
      }

      if (!editPatient.address?.trim()) {
        toast({
          title: "Validation Error",
          description: "Address is required.",
          variant: "destructive",
        });
        return;
      }

      if (!editPatient.emergencyContact?.trim()) {
        toast({
          title: "Validation Error",
          description: "Emergency contact is required.",
          variant: "destructive",
        });
        return;
      }

      // Emergency contact validation - should be exactly 10 digits
      const emergencyNumber = editPatient.emergencyContact.replace(/\D/g, '');
      if (emergencyNumber.length !== 10) {
        toast({
          title: "Validation Error",
          description: "Emergency contact must be exactly 10 digits.",
          variant: "destructive",
        });
        return;
      }

      // Attender phone validation (if provided)
      if (editPatient.attenderPhone?.trim()) {
        const attenderNumber = editPatient.attenderPhone.replace(/\D/g, '');
        if (attenderNumber.length !== 10) {
          toast({
            title: "Validation Error",
            description: "Attender phone number must be exactly 10 digits.",
            variant: "destructive",
          });
          return;
        }
      }

      // Email validation (if provided)
      if (editPatient.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editPatient.email)) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid email address.",
            variant: "destructive",
          });
          return;
        }
      }

      // Date validation
      if (!editPatient.admissionDate) {
        toast({
          title: "Validation Error",
          description: "Admission date is required.",
          variant: "destructive",
        });
        return;
      }

      // Validate admission date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      if (editPatient.admissionDate > today) {
        toast({
          title: "Validation Error",
          description: "Admission date cannot be in the future.",
          variant: "destructive",
        });
        return;
      }

      // Validate date of birth (if provided)
      if (editPatient.dateOfBirth) {
        if (editPatient.dateOfBirth > today) {
          toast({
            title: "Validation Error",
            description: "Date of birth cannot be in the future.",
            variant: "destructive",
          });
          return;
        }
      }

      // Since age is now auto-calculated from date of birth, no validation needed for age mismatch

      // File size validation for any new uploads
      const filesToValidate = [
        { file: editDocuments.photo, name: 'Photo' },
        { file: editDocuments.patientAadhar, name: 'Patient Aadhar' },
        { file: editDocuments.patientPan, name: 'Patient PAN' },
        { file: editDocuments.attenderAadhar, name: 'Attender Aadhar' },
        { file: editDocuments.attenderPan, name: 'Attender PAN' }
      ];

      for (const { file, name } of filesToValidate) {
        if (!validateEditFileSize(file)) {
          toast({
            title: "File Validation Error",
            description: `${name} file is too large. Please select a file under 5MB.`,
            variant: "destructive",
          });
          return;
        }
      }

      console.log('✅ All validations passed. Proceeding with patient update...');

      // Log current editDocuments state for debugging
      console.log('🔄 Starting file uploads...');
      console.log('📋 Current editDocuments state:', {
        photo: editDocuments.photo ? { name: editDocuments.photo.name, size: editDocuments.photo.size } : null,
        patientAadhar: editDocuments.patientAadhar ? { name: editDocuments.patientAadhar.name, size: editDocuments.patientAadhar.size } : null,
        patientPan: editDocuments.patientPan ? { name: editDocuments.patientPan.name, size: editDocuments.patientPan.size } : null,
        attenderAadhar: editDocuments.attenderAadhar ? { name: editDocuments.attenderAadhar.name, size: editDocuments.attenderAadhar.size } : null,
        attenderPan: editDocuments.attenderPan ? { name: editDocuments.attenderPan.name, size: editDocuments.attenderPan.size } : null
      });

      // Process any new uploaded files to server
      let updatedPhoto = editPatient.photo;
      let updatedPatientAadhar = editPatient.patientAadhar;
      let updatedPatientPan = editPatient.patientPan;
      let updatedAttenderAadhar = editPatient.attenderAadhar;
      let updatedAttenderPan = editPatient.attenderPan;

          // Upload new files to server and get file paths
      if (editDocuments.photo) {
        try {
          console.log('🖼️ Uploading photo:', editDocuments.photo.name);
          console.log('🖼️ Patient ID for upload:', editPatient.id);
          console.log('🖼️ Patient originalId for upload:', editPatient.originalId);
          console.log('🖼️ Patient object keys:', Object.keys(editPatient));
          console.log('🖼️ Full patient object:', {
            id: editPatient.id,
            originalId: editPatient.originalId,
            name: editPatient.name
          });
          
          // Use the formatted patient ID (P0001) for folder creation - this should match existing folder structure
          const patientIdForUpload = editPatient.id; // This should be P0001 format
          console.log('🖼️ Using patient ID for folder:', patientIdForUpload);
          console.log('🖼️ Patient ID type:', typeof patientIdForUpload);
          console.log('🖼️ Patient ID string conversion:', patientIdForUpload.toString());
          
          // Validate that we have a proper patient ID (not temp)
          if (!patientIdForUpload || patientIdForUpload === 'temp' || patientIdForUpload.toString().trim() === '') {
            console.error('❌ Invalid patient ID detected:', patientIdForUpload);
            throw new Error('Cannot upload photo: Invalid patient ID. Please refresh the page and try again.');
          }
          
          console.log('🚀 About to call uploadPatientFile with:');
          console.log('  - file:', editDocuments.photo.name);
          console.log('  - patientId:', patientIdForUpload.toString());
          console.log('  - fieldName: photo');
          
          updatedPhoto = await uploadPatientFile(editDocuments.photo, patientIdForUpload.toString(), 'photo');
          console.log('✅ Photo uploaded successfully:', updatedPhoto);
          
          // Check if photo was saved to temp folder (indicates ID issue)
          if (updatedPhoto && updatedPhoto.includes('/temp/')) {
            console.error('❌ Photo was saved to temp folder - patient ID issue detected!');
            console.error('❌ Patient ID used:', patientIdForUpload);
            console.error('❌ Photo path:', updatedPhoto);
            throw new Error('Photo upload failed: saved to temp folder instead of patient folder. Please check patient ID.');
          }
          
          // Validate that the photo path is in the correct format
          if (updatedPhoto && !updatedPhoto.startsWith('Photos/')) {
            console.warn('⚠️ Photo path does not start with Photos/, correcting format...');
            console.warn('⚠️ Original path:', updatedPhoto);
            // Ensure path starts with Photos/
            if (updatedPhoto.startsWith('/')) {
              updatedPhoto = `Photos${updatedPhoto}`;
            } else {
              updatedPhoto = `Photos/${updatedPhoto}`;
            }
            console.log('✅ Corrected photo path:', updatedPhoto);
          }
          
          // Verify photo URL can be constructed properly
          const testUrl = getPatientPhotoUrl(updatedPhoto);
          console.log('🔗 Testing photo URL construction:', testUrl);
          
          // Force immediate photo refresh
          console.log('🔄 Forcing immediate photo refresh after upload...');
          setPhotoRefreshTrigger(prev => prev + 1);
          
          // Delete old photo if it exists and is a server file
          if (editPatient.photo && !editPatient.photo.startsWith('data:') && editPatient.photo !== updatedPhoto) {
            try {
              console.log('🗑️ Attempting to delete old photo:', editPatient.photo);
              await deletePatientFile(editPatient.photo);
              console.log('🗑️ Old photo deleted successfully');
            } catch (error) {
              console.log('Could not delete old photo:', error);
            }
          }
        } catch (error) {
          console.error('❌ Photo upload failed:', error);
          toast({
            title: "Photo Upload Failed",
            description: `Failed to upload photo: ${error.message}`,
            variant: "destructive",
          });
          throw new Error(`Photo upload failed: ${error.message}`);
        }
      }
      if (editDocuments.patientAadhar) {
        try {
          console.log('📄 Uploading Patient Aadhar:', editDocuments.patientAadhar.name);
          updatedPatientAadhar = await uploadPatientFile(editDocuments.patientAadhar, editPatient.id, 'patientAadhar');
          console.log('✅ Patient Aadhar uploaded successfully:', updatedPatientAadhar);
          // Delete old file if it exists and is a server file
          if (editPatient.patientAadhar && !editPatient.patientAadhar.startsWith('data:') && editPatient.patientAadhar !== updatedPatientAadhar) {
            try {
              await deletePatientFile(editPatient.patientAadhar);
            } catch (error) {
              console.log('Could not delete old patientAadhar:', error);
            }
          }
        } catch (error) {
          console.error('❌ Patient Aadhar upload failed:', error);
          throw new Error(`Patient Aadhar upload failed: ${error.message}`);
        }
      }
      if (editDocuments.patientPan) {
        updatedPatientPan = await uploadPatientFile(editDocuments.patientPan, editPatient.id, 'patientPan');
        // Delete old file if it exists and is a server file
        if (editPatient.patientPan && !editPatient.patientPan.startsWith('data:') && editPatient.patientPan !== updatedPatientPan) {
          try {
            await deletePatientFile(editPatient.patientPan);
          } catch (error) {
            console.log('Could not delete old patientPan:', error);
          }
        }
      }
      if (editDocuments.attenderAadhar) {
        updatedAttenderAadhar = await uploadPatientFile(editDocuments.attenderAadhar, editPatient.id, 'attenderAadhar');
        // Delete old file if it exists and is a server file
        if (editPatient.attenderAadhar && !editPatient.attenderAadhar.startsWith('data:') && editPatient.attenderAadhar !== updatedAttenderAadhar) {
          try {
            await deletePatientFile(editPatient.attenderAadhar);
          } catch (error) {
            console.log('Could not delete old attenderAadhar:', error);
          }
        }
      }
      if (editDocuments.attenderPan) {
        updatedAttenderPan = await uploadPatientFile(editDocuments.attenderPan, editPatient.id, 'attenderPan');
        // Delete old file if it exists and is a server file
        if (editPatient.attenderPan && !editPatient.attenderPan.startsWith('data:') && editPatient.attenderPan !== updatedAttenderPan) {
          try {
            await deletePatientFile(editPatient.attenderPan);
          } catch (error) {
            console.log('Could not delete old attenderPan:', error);
          }
        }
      }

      // Convert patient data to database format
      const updateData = {
        name: editPatient.name || '',
        age: editPatient.age || 0,
        gender: editPatient.gender || '',
        phone: editPatient.phone || '',
        email: editPatient.email || '',
        address: editPatient.address || '',
        emergencyContact: editPatient.emergencyContact || '',
        medicalHistory: editPatient.medicalHistory || '',
        status: editPatient.status || 'Active',
        attenderName: editPatient.attenderName || '',
        attenderPhone: editPatient.attenderPhone || '',
        attenderRelationship: editPatient.attenderRelationship || '',
        photo: updatedPhoto || '',
        patientAadhar: updatedPatientAadhar || '',
        patientPan: updatedPatientPan || '',
        attenderAadhar: updatedAttenderAadhar || '',
        attenderPan: updatedAttenderPan || '',
        fees: editPatient.fees || 0,
        bloodTest: editPatient.bloodTest || 0,
        pickupCharge: editPatient.pickupCharge || 0,
        totalAmount: editPatient.totalAmount || 0,
        payAmount: editPatient.payAmount || 0,
        balance: editPatient.balance || 0,
        paymentType: editPatient.paymentType || '',
        fatherName: editPatient.fatherName || '',
        motherName: editPatient.motherName || '',
        dateOfBirth: formatDateForBackend(editPatient.dateOfBirth),
        marriageStatus: editPatient.marriageStatus || '',
        employeeStatus: editPatient.employeeStatus || '',
        admissionDate: formatDateForBackend(editPatient.admissionDate)
      };
      
      console.log('📅 Date values being saved:');
      console.log('  - Raw admissionDate:', editPatient.admissionDate);
      console.log('  - Raw dateOfBirth:', editPatient.dateOfBirth);
      console.log('  - Formatted admissionDate for backend:', formatDateForBackend(editPatient.admissionDate));
      console.log('  - Formatted dateOfBirth for backend:', formatDateForBackend(editPatient.dateOfBirth));
      
      // Additional debugging for admission date
      if (editPatient.admissionDate) {
        const admissionDateObj = new Date(editPatient.admissionDate);
        console.log('  - Admission Date Details:');
        console.log('    * Year:', admissionDateObj.getFullYear());
        console.log('    * Month:', admissionDateObj.getMonth() + 1);
        console.log('    * Day:', admissionDateObj.getDate());
        console.log('    * ISO String:', admissionDateObj.toISOString());
        console.log('    * Local String:', admissionDateObj.toString());
      }
      
      console.log('Submitting patient data:', updateData);
      console.log('📸 Final file paths being saved:');
      console.log('  - Photo:', updatedPhoto);
      console.log('  - Patient Aadhar:', updatedPatientAadhar);
      console.log('  - Patient PAN:', updatedPatientPan);
      console.log('  - Attender Aadhar:', updatedAttenderAadhar);
      console.log('  - Attender PAN:', updatedAttenderPan);
      
      // Validate photo path before saving
      if (updatedPhoto && updatedPhoto !== editPatient.photo) {
        console.log('🔍 Photo path changed, verifying new path:', updatedPhoto);
        console.log('🔍 Previous photo path:', editPatient.photo);
        
        // Double-check photo URL construction works
        const verifyUrl = getPatientPhotoUrl(updatedPhoto);
        console.log('🔗 Verification URL:', verifyUrl);
        
        if (!verifyUrl || verifyUrl === '') {
          console.error('❌ Photo URL construction failed for path:', updatedPhoto);
          throw new Error('Photo path validation failed - unable to construct valid URL');
        }
      }
      
      console.log('💾 Saving patient data to database...');
      await DatabaseService.updatePatient(editPatient.originalId, updateData);
      console.log('✅ Patient data successfully updated in database');
      
      // Verify the photo was saved correctly by logging the final data
      if (updatedPhoto) {
        console.log('📸 Final verification - photo path saved:', updatedPhoto);
        console.log('📸 Final verification - photo URL:', getPatientPhotoUrl(updatedPhoto));
      }
      
      // Update the editPatient state with new images for immediate preview
      const updatedEditPatient = {
        ...editPatient,
        photo: updatedPhoto,
        patientAadhar: updatedPatientAadhar,
        patientPan: updatedPatientPan,
        attenderAadhar: updatedAttenderAadhar,
        attenderPan: updatedAttenderPan
      };
      
      console.log('📋 Updated patient data for state update:', {
        id: updatedEditPatient.id,
        photo: updatedPhoto,
        patientAadhar: updatedPatientAadhar,
        patientPan: updatedPatientPan,
        attenderAadhar: updatedAttenderAadhar,
        attenderPan: updatedAttenderPan
      });
      
      // Update local state
      const updatedPatients = patients.map(p => {
        if (p.id === editPatient.id) {
          console.log(`📝 Updating patient ${p.id} in local state with new file paths`);
          const updatedPatient = {
            ...updatedEditPatient,
            photo: updatedPhoto || '', // Ensure photo path is properly set
          };
          console.log(`📸 Updated patient photo path: ${updatedPatient.photo}`);
          return updatedPatient;
        }
        return p;
      });
      
      console.log('📊 Updated patients array length:', updatedPatients.length);
      setPatients(updatedPatients);
      console.log('✅ Local state updated with new file paths');
      
      // Additional photo refresh to ensure table updates
      console.log('📸 Triggering additional photo refresh for table...');
      setPhotoRefreshTrigger(prev => prev + 1);
      
      // Force a re-render to ensure UI updates
      console.log('🔄 Forcing component re-render...');
      
      // Additional verification: Log the updated patient data
      const verifiedPatient = updatedPatients.find(p => p.id === editPatient.id);
      if (verifiedPatient) {
        console.log('🔍 Verified updated patient in state:', {
          id: verifiedPatient.id,
          name: verifiedPatient.name,
          photo: verifiedPatient.photo,
          patientAadhar: verifiedPatient.patientAadhar,
          patientPan: verifiedPatient.patientPan,
          attenderAadhar: verifiedPatient.attenderAadhar,
          attenderPan: verifiedPatient.attenderPan
        });
      }
      
      // Sync payment data to patient_payments table
      await syncPaymentDataToDatabase(updatedEditPatient);
      
      console.log('💾 Setting editPatient to null to close form');
      setEditPatient(null);
      
      console.log('🗂️ Resetting editDocuments state');
      setEditDocuments({
        photo: null,
        patientAadhar: null,
        patientPan: null,
        attenderAadhar: null,
        attenderPan: null
      });
      
      // Cleanup preview URLs
      Object.values(previewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setPreviewUrls({});
      
      // Trigger photo refresh first
      console.log('🔄 Triggering photo refresh...');
      setPhotoRefreshTrigger(prev => prev + 1);
      
      // Force immediate table re-render with new photo path
      if (updatedPhoto && updatedPhoto !== editPatient.photo) {
        console.log('🖼️ Photo changed, forcing immediate table refresh...');
        console.log('🖼️ New photo path in state update:', updatedPhoto);
        
        // Construct test URL to verify it works
        const testPhotoUrl = getPatientPhotoUrl(updatedPhoto);
        console.log('🔗 Test photo URL for immediate display:', testPhotoUrl);
      }
      
      // Force browser to clear all cached images immediately with more aggressive cache busting
      console.log('🔄 Forcing image cache refresh...');
      const allImages = document.querySelectorAll('img');
      allImages.forEach(img => {
        if (img.src && img.src.includes(import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'localhost:4000')) {
          // Create a completely new URL with timestamp and random parameters
          const url = new URL(img.src.split('?')[0]); // Remove existing parameters
          url.searchParams.set('t', Date.now().toString());
          url.searchParams.set('r', Math.random().toString(36).substring(7));
          url.searchParams.set('updated', 'true');
          url.searchParams.set('cache_bust', Date.now().toString());
          img.src = url.toString();
          
          // Force immediate reload by toggling src
          const originalSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = originalSrc;
          }, 100);
        }
      });
      
      // Clear browser cache for patient images specifically
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => 
              caches.delete(cacheName)
            )
          );
          console.log('🗑️ Browser caches cleared');
        } catch (error) {
          console.log('Could not clear browser cache:', error);
        }
      }
      
      // Reload patient data from server to ensure UI is up to date
      console.log('🔄 Reloading patient data from server...');
      await loadPatients();
      
      // Additional forced refresh after a delay to ensure new photo loads
      setTimeout(async () => {
        console.log('🔄 Final refresh to ensure photo appears...');
        setPhotoRefreshTrigger(prev => prev + 1);
        
        // Force refresh of the specific updated patient's photo
        const updatedPatientImages = document.querySelectorAll(`img[alt*="${updatedEditPatient.name}"]`);
        updatedPatientImages.forEach(img => {
          const imgElement = img as HTMLImageElement;
          if (imgElement.src && imgElement.src.includes(import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'localhost:4000')) {
            const url = new URL(imgElement.src.split('?')[0]);
            url.searchParams.set('final_refresh', Date.now().toString());
            url.searchParams.set('patient_updated', updatedEditPatient.id);
            imgElement.src = url.toString();
          }
        });
        
        await loadPatients();
      }, 1000); // Increased delay to 1 second
      
      // One more refresh after 2 seconds as final fallback
      setTimeout(() => {
        console.log('🔄 Ultimate fallback refresh...');
        setPhotoRefreshTrigger(prev => prev + 1);
      }, 2000);
      
      console.log('✅ Edit form closed and state reset');
      
      toast({
        title: "Patient Updated",
        description: `Patient information has been successfully updated.${updatedPhoto && updatedPhoto !== editPatient.photo ? ' Profile photo updated.' : ''}`,
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to sync payment data from patient to patient_payments table
  const syncPaymentDataToDatabase = async (patient: Patient) => {
    try {
      // Calculate payment details using correct field names
      const monthlyFees = Number(patient.fees || 0);
      const bloodTest = Number(patient.bloodTest || 0);
      const pickupCharge = Number(patient.pickupCharge || 0);
      const totalAmount = monthlyFees + bloodTest + pickupCharge;
      const payAmount = Number(patient.payAmount || 0);
      const balance = totalAmount - payAmount;
      
      // Check if a payment record already exists for this patient
      try {
        const existingPayments = await DatabaseService.getAllPatientPayments();
        const patientPayments = existingPayments.filter((p: any) => p.patient_id == patient.id || p.patientId == patient.id);
        
        if (patientPayments.length === 0 && (totalAmount > 0 || payAmount > 0)) {
          // Create initial payment record if none exists and there's fee or payment data
          const paymentData = {
            patient_id: patient.id,
            patient_name: patient.name,
            monthly_fees: monthlyFees,
            other_fees: bloodTest + pickupCharge,
            carry_forward: 0,
            paid_amount: payAmount,
            total_balance: balance,
            payment_status: balance <= 0 ? 'Paid' : (payAmount > 0 ? 'Partial' : 'Pending'),
            payment_type: patient.paymentType || 'Cash',
            payment_date: patient.admissionDate || new Date().toISOString().split('T')[0],
            description: `Payment record for ${patient.name}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await DatabaseService.addPatientPayment(paymentData);
          console.log('Synced payment data to database for patient:', patient.name);
        } else if (patientPayments.length > 0) {
          // Update existing payment record
          const existingPayment = patientPayments[0];
          const updatedPaymentData = {
            patient_name: patient.name,
            monthly_fees: monthlyFees,
            other_fees: bloodTest + pickupCharge,
            paid_amount: payAmount,
            total_balance: balance,
            payment_status: balance <= 0 ? 'Paid' : (payAmount > 0 ? 'Partial' : 'Pending'),
            payment_type: patient.paymentType || 'Cash',
            updated_at: new Date().toISOString()
          };
          
          await DatabaseService.updatePatientPayment(existingPayment.id, updatedPaymentData);
          console.log('Updated payment data in database for patient:', patient.name);
        }
      } catch (error) {
        console.warn('Failed to sync payment data to database:', error);
        // Fallback to localStorage update
        const existingPayments = JSON.parse(localStorage.getItem('patientPaymentRecords') || '[]');
        const patientPaymentIndex = existingPayments.findIndex((p: any) => p.patientId === patient.id);
        
        if (patientPaymentIndex === -1 && payAmount > 0) {
          // Add new payment record to localStorage
          const newPaymentRecord = {
            id: `${patient.id}-${Date.now()}`,
            patientId: patient.id,
            date: patient.admissionDate || new Date().toISOString().split('T')[0],
            amount: payAmount,
            comment: `Payment record for ${patient.name}`,
            paymentMode: patient.paymentType || 'Cash',
            balanceRemaining: balance,
            createdBy: 'System',
            createdAt: new Date().toISOString()
          };
          existingPayments.push(newPaymentRecord);
          localStorage.setItem('patientPaymentRecords', JSON.stringify(existingPayments));
        } else if (patientPaymentIndex >= 0) {
          // Update existing payment record in localStorage
          existingPayments[patientPaymentIndex] = {
            ...existingPayments[patientPaymentIndex],
            amount: payAmount,
            balanceRemaining: balance,
            paymentMode: patient.paymentType || 'Cash',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem('patientPaymentRecords', JSON.stringify(existingPayments));
        }
      }
    } catch (error) {
      console.error('Error syncing payment data:', error);
    }
  };

  const handleDelete = (patient: Patient) => {
    setDeletePatient(patient);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletePatient) return;
    try {
      await DatabaseService.deletePatient(deletePatient.originalId);
      // Remove from local state
      const updatedPatients = patients.filter(p => p.id !== deletePatient.id);
      setPatients(updatedPatients);
      setShowDeleteConfirm(false);
      setDeletePatient(null);
      toast({
        title: "Patient Deleted",
        description: `${deletePatient.name} and all related records (attendance, history, payments) have been permanently deleted from the database.`,
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient and related records. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: 'bg-success text-success-foreground',
      Inactive: 'bg-muted text-muted-foreground',
      Critical: 'bg-destructive text-destructive-foreground',
      Discharged: 'bg-warning text-warning-foreground'
    };
    return variants[status as keyof typeof variants] || 'bg-muted text-muted-foreground';
  };

  const exportToCSV = () => {
    const headers = [
      'S No',
      'Patient ID',
      'Name',
      'Age',
      'Gender',
      'Phone',
      'Email',
      'Address',
      'Emergency Contact',
      'Medical History',
      'Admission Date',
      'Status',
      'Attender Name',
      'Attender Phone',
      'Photo',
      'Fees',
      'Blood Test',
      'Pickup Charge',
      'Total Amount',
      'Pay Amount',
      'Balance',
      'Payment Type',
      "Father's Name",
      "Mother's Name",
      'Attender Relationship',
      'Date of Birth',
      'Marriage Status',
      'Employee Status'
    ];
    const csvData = [
      headers.join(','),
      ...filteredPatients.map((p, idx) => [
        idx + 1,
        p.id,
        p.name,
        p.age,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.emergencyContact,
        p.medicalHistory,
        p.admissionDate && p.admissionDate.getFullYear() > 1900 && !isNaN(p.admissionDate.getTime()) 
          ? format(p.admissionDate, 'dd/MM/yyyy') : 'Not Set',
        p.status,
        p.attenderName,
        p.attenderPhone,
        p.photo,
        p.fees,
        p.bloodTest,
        p.pickupCharge,
        p.totalAmount,
        p.payAmount,
        p.balance,
        p.paymentType,
        p.fatherName,
        p.motherName,
        p.attenderRelationship,
        p.dateOfBirth && !isNaN(new Date(p.dateOfBirth).getTime()) ? format(new Date(p.dateOfBirth), 'dd/MM/yyyy') : '',
        p.marriageStatus,
        p.employeeStatus
      ].map(val => typeof val === 'string' ? '"' + val.replace(/"/g, '""') + '"' : val).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patients-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient Management</h1>
                {/* <p className="modern-page-subtitle">
                  Manage and view all registered patients in your healthcare system
                </p> */}
              </div>
            </div>
          
            <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                text={`All Patients (${months[(filterMonth || 1) - 1]} ${filterYear})`}
                onClick={() => setShowMonthYearDialog(true)}
              />
              
              <Button 
                onClick={exportToCSV}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button 
                onClick={() => navigate('/patients/add')}
                className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Patient</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="crm-stats-grid">
          {/* Total Patients Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Total Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredPatients.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Registered</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Patients Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                    {filteredPatients.filter(p => p.status === 'Active').length}
                  </p>
                  <div className="flex items-center text-xs text-green-600">
                    <UserCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In treatment</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Critical Cases Card */}
          <Card className="crm-stat-card crm-stat-card-red">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700 mb-1 truncate">Critical Cases</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
                    {filteredPatients.filter(p => p.status === 'Critical').length}
                  </p>
                  <div className="flex items-center text-xs text-red-600">
                    <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Urgent care</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-red">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Last Updated Card */}
          <Card className="crm-stat-card crm-stat-card-orange">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1 truncate">Last Updated</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Today</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-orange">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="crm-controls-container">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <Card className="crm-table-container">
          <CardHeader className="crm-table-header">
            <div className="crm-table-title">
              <Users className="crm-table-title-icon" />
              <span className="crm-table-title-text">Patients List ({filteredPatients.length})</span>
              <span className="crm-table-title-text-mobile">Patients ({filteredPatients.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
        
        {/* Scrollable Table View for All Screen Sizes */}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>S No</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Photo</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Patient ID</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Name</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Age</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Gender</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Phone</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Admission Date</span>
                    <span className="sm:hidden">Date</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Status</span>
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-3 lg:px-4 py-3 text-center font-medium text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span>Actions</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((patient, idx) => (
                  <TableRow key={patient.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center">
                      <PatientPhoto 
                        key={`${patient.id}-${patient.photo}-${photoRefreshTrigger}`}
                        photoPath={patient.photo} 
                        alt={patient.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mx-auto border bg-muted"
                      />
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 font-medium text-center text-xs sm:text-sm whitespace-nowrap">
                      <button 
                        onClick={() => {
                          try {
                            // Use raw numeric ID for navigation - the PatientBiodata component will handle the format
                            const patientIdForRoute = patient.id;
                            console.log('🔗 Button clicked for patient details:', {
                              patientId: patient.id,
                              originalId: patient.originalId,
                              name: patient.name,
                              patientIdForRoute: patientIdForRoute,
                              routeWillBe: `/patients/details/${patientIdForRoute}`
                            });
                            console.log('🚀 Attempting navigation to:', `/patients/details/${patientIdForRoute}`);
                            
                            // Use React Router navigate
                            navigate(`/patients/details/${patientIdForRoute}`);
                            
                            console.log('✅ Navigation call completed');
                          } catch (error) {
                            console.error('❌ Navigation error:', error);
                          }
                        }}
                        className="text-primary font-medium hover:underline hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 p-1 h-auto text-xs sm:text-sm cursor-pointer rounded-md inline-flex items-center gap-1"
                        title={`View full details for ${patient.name} (Click to open comprehensive patient information)`}
                      >
                        �
                        {patient.id?.startsWith('P') ? patient.id : `P${String(patient.originalId || patient.id).padStart(4, '0')}`}
                      </button>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm max-w-[100px] sm:max-w-[120px] truncate">{patient.name}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{patient.age}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{patient.gender}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">{patient.phone}</TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                      {patient.admissionDate && 
                       patient.admissionDate instanceof Date && 
                       !isNaN(patient.admissionDate.getTime()) && 
                       patient.admissionDate.getFullYear() >= 1900 && 
                       patient.admissionDate.getFullYear() <= 2100
                        ? format(patient.admissionDate, 'dd/MM/yyyy') 
                        : <span className="text-gray-400 text-xs">Not Set</span>}
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <Badge className={`${getStatusBadge(patient.status)} text-xs`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-center whitespace-nowrap">
                      <div className="action-buttons-container">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewPatient(patient)}
                          className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="View Patient"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                          className="action-btn-lead action-btn-edit h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Edit Patient"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(patient)}
                          className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-12 bg-white">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No patients found</h3>
              <p className="text-sm text-gray-500">
                No patients match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Responsive Pagination */}
        {filteredPatients.length > rowsPerPage && (
          <div className="crm-pagination-container">
            {/* Pagination Info */}
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              <span className="hidden sm:inline">
                Page {currentPage} of {Math.ceil(filteredPatients.length / rowsPerPage)} 
                ({filteredPatients.length} total patients)
              </span>
              <span className="sm:hidden">
                {currentPage} / {Math.ceil(filteredPatients.length / rowsPerPage)}
              </span>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              {/* Page Numbers for Desktop */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(filteredPatients.length / rowsPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);
                  let pageNumber;
                  
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 p-0 text-xs ${
                        currentPage === pageNumber 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredPatients.length / rowsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredPatients.length / rowsPerPage)}
                className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* View Patient Dialog - Glass Morphism Design */}
      {viewPatient && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewPatient(null)}
        >
          <div 
            className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Glass Morphism Style */}
            <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              {/* Gradient Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
              
              {/* Header Content */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                  <PatientPhoto 
                    key={`view-${viewPatient.id}-${viewPatient.photo}-${photoRefreshTrigger}`}
                    photoPath={viewPatient.photo} 
                    alt={viewPatient.name}
                    className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg"
                  />
                  {/* Status Badge */}
                  <div className="absolute -bottom-1 -right-1">
                    <Badge className={`${getStatusBadge(viewPatient.status)} border-2 border-white shadow-sm text-xs`}>
                      {viewPatient.status.charAt(0).toUpperCase() + viewPatient.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                {/* Title and Info Section */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{viewPatient.name}</span>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                      {viewPatient.id}
                    </span>
                  </div>
                </div>
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewPatient(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
              <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                    </div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Full Name</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewPatient.name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-bold text-xs sm:text-sm">{viewPatient.age}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Age & Gender</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{viewPatient.age} years • {viewPatient.gender}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Date of Birth</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            {viewPatient.dateOfBirth && !isNaN(new Date(viewPatient.dateOfBirth).getTime()) 
                              ? format(new Date(viewPatient.dateOfBirth), 'dd-MM-yyyy') 
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xs sm:text-sm">📞</span>
                    </div>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-xs sm:text-sm md:text-lg">📞</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Phone Number</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewPatient.phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs sm:text-sm md:text-lg">📧</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Email Address</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewPatient.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 text-xs sm:text-sm md:text-lg">🚨</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Emergency Contact</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewPatient.emergencyContact}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 text-xs sm:text-sm md:text-lg">🏠</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Address</Label>
                          <p className="text-sm font-medium text-gray-900 leading-relaxed">{viewPatient.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-red-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-red-600" />
                    </div>
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs sm:text-sm md:text-lg">📅</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="text-xs font-medium text-red-600 uppercase tracking-wide">Admission Date</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            {viewPatient.admissionDate && !isNaN(viewPatient.admissionDate.getTime()) 
                              ? format(viewPatient.admissionDate, 'dd-MM-yyyy') 
                              : 'Invalid Date'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {viewPatient.medicalHistory && (
                      <div className="sm:col-span-2 bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 text-xs sm:text-sm md:text-lg">📋</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Medical History</Label>
                            <p className="text-sm text-gray-900 leading-relaxed mt-1">{viewPatient.medicalHistory}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information Section */}
                <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 backdrop-blur-sm border border-amber-200/50 shadow-lg">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm sm:text-lg md:text-xl">💰</span>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        Payment Information
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-600/70 mt-1">Financial details and billing information</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {/* Fees Card */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-amber-200/30 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs sm:text-sm md:text-lg">🏥</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Consultation Fees</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mt-1">₹{viewPatient.fees || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Blood Test Card */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-amber-200/30 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs sm:text-sm md:text-lg">🩸</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs font-medium text-red-600 uppercase tracking-wide">Blood Test</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mt-1">₹{viewPatient.bloodTest || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pickup Charge Card */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-amber-200/30 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-xs sm:text-sm md:text-lg">🚗</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Pickup Charge</Label>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mt-1">₹{viewPatient.pickupCharge || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Total Amount Card */}
                    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-purple-200/50 shadow-md">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs sm:text-sm md:text-lg">📊</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total Amount</Label>
                          <p className="text-sm sm:text-lg md:text-xl font-bold text-purple-700 mt-1">₹{viewPatient.totalAmount || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pay Amount Card */}
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-green-200/50 shadow-md">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs sm:text-sm md:text-lg">✅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs font-medium text-green-600 uppercase tracking-wide">Amount Paid</Label>
                          <p className="text-sm sm:text-lg md:text-xl font-bold text-green-700 mt-1">₹{viewPatient.payAmount || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Balance Card */}
                    <div className={`backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border shadow-md ${
                      (viewPatient.balance || 0) > 0 
                        ? 'bg-gradient-to-br from-red-100 to-rose-100 border-red-200/50' 
                        : 'bg-gradient-to-br from-gray-100 to-slate-100 border-gray-200/50'
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          (viewPatient.balance || 0) > 0 
                            ? 'bg-red-500' 
                            : 'bg-gray-500'
                        }`}>
                          <span className="text-white text-xs sm:text-sm md:text-lg">
                            {(viewPatient.balance || 0) > 0 ? '⚠️' : '🎉'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className={`text-xs font-medium uppercase tracking-wide ${
                            (viewPatient.balance || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {(viewPatient.balance || 0) > 0 ? 'Outstanding Balance' : 'Balance'}
                          </Label>
                          <p className={`text-sm sm:text-lg md:text-xl font-bold mt-1 ${
                            (viewPatient.balance || 0) > 0 ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            ₹{viewPatient.balance || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Type Section */}
                  {viewPatient.paymentType && (
                    <div className="mt-3 sm:mt-4 md:mt-6 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-amber-200/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-xs sm:text-sm md:text-lg">💳</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Payment Method</Label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.paymentType}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>              {viewPatient.medicalHistory && (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label className="font-medium text-foreground text-sm">Medical History</Label>
                  <div className="p-2 sm:p-3 bg-muted rounded-md border">
                    <p className="text-sm">{viewPatient.medicalHistory}</p>
                  </div>
                </div>
              )}

                {/* Document Information Section */}
                <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm sm:text-lg md:text-xl">📄</span>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">
                        Document Information
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600/70 mt-1">Identity documents and verification files</p>
                    </div>
                  </div>

                  {/* Debug Information */}
                  {/* <div className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-lg sm:rounded-xl">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <span className="text-yellow-600 text-xs sm:text-sm">🔍</span>
                      <strong className="text-xs sm:text-sm font-medium text-yellow-800">Debug Information</strong>
                    </div>
                    <div className="text-xs space-y-1 sm:space-y-2 text-yellow-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                        <div>
                          <strong>Database Values:</strong>
                          <br />
                          • Patient Aadhar: {viewPatient.patientAadhar || 'Not set'} {viewPatient.patientAadhar ? '✅' : '❌'}
                          <br />
                          • Patient PAN: {viewPatient.patientPan || 'Not set'} {viewPatient.patientPan ? '✅' : '❌'}
                          <br />
                          • Attender Aadhar: {viewPatient.attenderAadhar || 'Not set'} {viewPatient.attenderAadhar ? '✅' : '❌'}
                          <br />
                          • Attender PAN: {viewPatient.attenderPan || 'Not set'} {viewPatient.attenderPan ? '✅' : '❌'}
                        </div>
                        <div>
                          <strong>System Info:</strong>
                          <br />
                          • Patient ID: {viewPatient.id}
                          <br />
                          • Last Refresh: {new Date().toLocaleTimeString()}
                          <br />
                          • Total Documents: {[viewPatient.patientAadhar, viewPatient.patientPan, viewPatient.attenderAadhar, viewPatient.attenderPan].filter(Boolean).length}
                        </div>
                      </div>
                    </div>
                  </div> */}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {/* Patient Documents */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-slate-200/30 shadow-sm">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-xs sm:text-sm">👤</span>
                        </div>
                        <h4 className="text-sm sm:text-base md:text-lg font-semibold text-blue-700">Patient Documents</h4>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3 md:space-y-4">
                        {viewPatient.patientAadhar && viewPatient.patientAadhar.trim() !== '' ? (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3 md:p-4 border border-blue-200/50">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <span className="text-blue-600 text-xs sm:text-sm">🪪</span>
                              <Label className="text-xs sm:text-sm font-medium text-blue-700">Aadhar Card</Label>
                            </div>
                            <div className="relative group">
                              <img
                                src={getPatientPhotoUrl(viewPatient.patientAadhar)}
                                alt="Patient Aadhar Card"
                                className="w-full h-24 sm:h-32 md:h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                onClick={() => window.open(getPatientPhotoUrl(viewPatient.patientAadhar), '_blank')}
                                onError={(e) => {
                                  console.error('❌ Failed to load Patient Aadhar image:', viewPatient.patientAadhar);
                                  console.error('❌ Constructed URL:', getPatientPhotoUrl(viewPatient.patientAadhar));
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  if (!img.parentNode?.querySelector('.error-message')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                    errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${viewPatient.patientAadhar}</div>`;
                                    img.parentNode?.appendChild(errorDiv);
                                  }
                                }}
                                onLoad={() => {
                                  console.log('✅ Patient Aadhar loaded successfully:', viewPatient.patientAadhar);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                                  Click to open
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {viewPatient.patientPan && viewPatient.patientPan.trim() !== '' ? (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-green-600 text-sm">💳</span>
                              <Label className="text-sm font-medium text-green-700">PAN Card</Label>
                            </div>
                            <div className="relative group">
                              <img
                                src={getPatientPhotoUrl(viewPatient.patientPan)}
                                alt="Patient PAN Card"
                                className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                onClick={() => window.open(getPatientPhotoUrl(viewPatient.patientPan), '_blank')}
                                onError={(e) => {
                                  console.error('❌ Failed to load Patient PAN image:', viewPatient.patientPan);
                                  console.error('❌ Constructed URL:', getPatientPhotoUrl(viewPatient.patientPan));
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  if (!img.parentNode?.querySelector('.error-message')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                    errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${viewPatient.patientPan}</div>`;
                                    img.parentNode?.appendChild(errorDiv);
                                  }
                                }}
                                onLoad={() => {
                                  console.log('✅ Patient PAN loaded successfully:', viewPatient.patientPan);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                                  Click to open
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {!viewPatient.patientAadhar && !viewPatient.patientPan && (
                          <div className="text-center py-8 text-gray-500">
                            <span className="text-4xl mb-2 block">📄</span>
                            <p className="text-sm">No patient documents uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Attender Documents */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-slate-200/30 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 text-sm">👥</span>
                        </div>
                        <h4 className="text-lg font-semibold text-purple-700">Attender Documents</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {viewPatient.attenderAadhar && viewPatient.attenderAadhar.trim() !== '' ? (
                          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200/50">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-purple-600 text-sm">🪪</span>
                              <Label className="text-sm font-medium text-purple-700">Aadhar Card</Label>
                            </div>
                            <div className="relative group">
                              <img
                                src={getPatientPhotoUrl(viewPatient.attenderAadhar)}
                                alt="Attender Aadhar Card"
                                className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                onClick={() => window.open(getPatientPhotoUrl(viewPatient.attenderAadhar), '_blank')}
                                onError={(e) => {
                                  console.error('❌ Failed to load Attender Aadhar image:', viewPatient.attenderAadhar);
                                  console.error('❌ Constructed URL:', getPatientPhotoUrl(viewPatient.attenderAadhar));
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  if (!img.parentNode?.querySelector('.error-message')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                    errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${viewPatient.attenderAadhar}</div>`;
                                    img.parentNode?.appendChild(errorDiv);
                                  }
                                }}
                                onLoad={() => {
                                  console.log('✅ Attender Aadhar loaded successfully:', viewPatient.attenderAadhar);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                                  Click to open
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {viewPatient.attenderPan && viewPatient.attenderPan.trim() !== '' ? (
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200/50">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-orange-600 text-sm">💳</span>
                              <Label className="text-sm font-medium text-orange-700">PAN Card</Label>
                            </div>
                            <div className="relative group">
                              <img
                                src={getPatientPhotoUrl(viewPatient.attenderPan)}
                                alt="Attender PAN Card"
                                className="w-full h-40 object-cover rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                onClick={() => window.open(getPatientPhotoUrl(viewPatient.attenderPan), '_blank')}
                                onError={(e) => {
                                  console.error('❌ Failed to load Attender PAN image:', viewPatient.attenderPan);
                                  console.error('❌ Constructed URL:', getPatientPhotoUrl(viewPatient.attenderPan));
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.display = 'none';
                                  if (!img.parentNode?.querySelector('.error-message')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                    errorDiv.innerHTML = `<div class="text-red-500 text-sm font-medium mb-2">⚠️ Failed to load image</div><div class="text-xs text-red-400 font-mono">${viewPatient.attenderPan}</div>`;
                                    img.parentNode?.appendChild(errorDiv);
                                  }
                                }}
                                onLoad={() => {
                                  console.log('✅ Attender PAN loaded successfully:', viewPatient.attenderPan);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-all duration-200">
                                  Click to open
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {!viewPatient.attenderAadhar && !viewPatient.attenderPan && (
                          <div className="text-center py-8 text-gray-500">
                            <span className="text-4xl mb-2 block">📄</span>
                            <p className="text-sm">No attender documents uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Dialog */}
      {editPatient && (
        <Dialog open={!!editPatient} onOpenChange={() => setEditPatient(null)}>
          <DialogContent className="editpopup form dialog-content sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="editpopup form dialog-header relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="flex items-center gap-3">
                <div className="editpopup form dialog-header icon-container p-2 bg-blue-100 rounded-lg">
                  <Edit2 className="editpopup form dialog-header icon h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="editpopup form dialog-title text-xl font-bold text-gray-900">
                    Edit Patient - {editPatient.id}
                  </DialogTitle>
                  <DialogDescription className="editpopup form dialog-description text-gray-600 mt-1">
                    Update patient information and medical details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              className="editpopup form form-container space-y-6 p-3 sm:p-4 md:p-6"
            >
              {/* Personal Information Section */}
              <div className="editpopup form form-section space-y-4">
                <h3 className="editpopup form form-section-title text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="editpopup form form-section-icon personal w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  Personal Information
                </h3>
                <div className="editpopup form form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="editpopup form form-field space-y-2">
                    <Label htmlFor="edit-name" className="editpopup form form-label text-sm font-medium text-gray-700">Patient Name <span className="editpopup form form-required text-destructive">*</span></Label>
                    <Input
                      id="edit-name"
                      value={editPatient.name}
                      onChange={(e) => setEditPatient({...editPatient, name: e.target.value})}
                      placeholder="Enter patient name"
                      className="editpopup form form-input mt-1 border-primary/30 focus:border-primary"
                      required
                    />
                  </div>
                  {/* Age field is now hidden and auto-calculated from date of birth */}
                  <div className="editpopup form form-field space-y-2">
                    <Label htmlFor="edit-gender" className="editpopup form form-label text-sm font-medium text-gray-700">Gender <span className="editpopup form form-required text-destructive">*</span></Label>
                    <Select
                      value={editPatient.gender}
                      onValueChange={(value) => setEditPatient({...editPatient, gender: value})}
                    >
                      <SelectTrigger className="editpopup form form-select-trigger mt-1 border-primary/30 focus:border-primary">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="editpopup form form-select-content bg-background border shadow-lg z-50">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">Status</Label>
                    <Select
                      value={editPatient.status}
                      onValueChange={(value) => setEditPatient({...editPatient, status: value})}
                    >
                      <SelectTrigger className="mt-1 border-primary/30 focus:border-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="Discharged">Discharged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Admission Date moved to Important Dates section */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-dob" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                    <Input
                      id="edit-dob"
                      type="date"
                      value={editPatient ? (formatDateForInput(editPatient.dateOfBirth) || '') : ''}
                      onChange={(e) => {
                        if (editPatient) {
                          const date = e.target.value ? parseDateFromInput(e.target.value) : null;
                          const calculatedAge = calculateAge(date);
                          setEditPatient({ 
                            ...editPatient, 
                            dateOfBirth: date,
                            age: calculatedAge
                          });
                        }
                      }}
                      className="mt-1 border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="editpopup form form-section space-y-4">
                <h3 className="editpopup form form-section-title text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="editpopup form form-section-icon contact w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="editpopup form form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">Phone Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-phone"
                      value={editPatient.phone}
                      onChange={(e) => {
                        // Phone number validation - only allow 10 digits
                        const numericValue = e.target.value.replace(/\D/g, '');
                        if (numericValue.length <= 10) {
                          setEditPatient({...editPatient, phone: numericValue});
                        }
                      }}
                      placeholder="10-digit mobile number"
                      className="mt-1"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editPatient.email}
                      onChange={(e) => setEditPatient({...editPatient, email: e.target.value})}
                      placeholder="Enter email address"
                      className="mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emergency" className="text-sm font-medium text-gray-700">Emergency Contact <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-emergency"
                      value={editPatient.emergencyContact}
                      onChange={(e) => {
                        // Emergency contact validation - only allow 10 digits
                        const numericValue = e.target.value.replace(/\D/g, '');
                        if (numericValue.length <= 10) {
                          setEditPatient({...editPatient, emergencyContact: numericValue});
                        }
                      }}
                      placeholder="10-digit emergency contact number"
                      className="mt-1 border-primary/30 focus:border-primary"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address" className="text-sm font-medium text-gray-700">Address <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="edit-address"
                    value={editPatient.address}
                    onChange={(e) => setEditPatient({...editPatient, address: e.target.value})}
                    placeholder="Enter complete address"
                    className="mt-1 border-primary/30 focus:border-primary"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Family Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                  Family Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-father-name" className="text-sm font-medium text-gray-700">Father's Name</Label>
                    <Input
                      id="edit-father-name"
                      value={editPatient.fatherName || ''}
                      onChange={(e) => setEditPatient({...editPatient, fatherName: e.target.value})}
                      placeholder="Enter father's name"
                      className="mt-1 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mother-name" className="text-sm font-medium text-gray-700">Mother's Name</Label>
                    <Input
                      id="edit-mother-name"
                      value={editPatient.motherName || ''}
                      onChange={(e) => setEditPatient({...editPatient, motherName: e.target.value})}
                      placeholder="Enter mother's name"
                      className="mt-1 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-marriage-status" className="text-sm font-medium text-gray-700">Marriage Status</Label>
                    <Select
                      value={editPatient.marriageStatus || ''}
                      onValueChange={(value) => setEditPatient({...editPatient, marriageStatus: value})}
                    >
                      <SelectTrigger className="mt-1 border-primary/30 focus:border-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employee-status" className="text-sm font-medium text-gray-700">Employee Status</Label>
                    <Select
                      value={editPatient.employeeStatus || ''}
                      onValueChange={(value) => setEditPatient({...editPatient, employeeStatus: value})}
                    >
                      <SelectTrigger className="mt-1 border-primary/30 focus:border-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Non-Employee">Non-Employee</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Attender Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-orange-600" />
                  </div>
                  Attender Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-attender-name" className="text-sm font-medium text-gray-700">Attender Name</Label>
                    <Input
                      id="edit-attender-name"
                      value={editPatient.attenderName}
                      onChange={(e) => setEditPatient({...editPatient, attenderName: e.target.value})}
                      placeholder="Enter attender name"
                      className="mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-attender-phone" className="text-sm font-medium text-gray-700">Attender Phone</Label>
                    <Input
                      id="edit-attender-phone"
                      value={editPatient.attenderPhone}
                      onChange={(e) => {
                        // Attender phone validation - only allow 10 digits
                        const numericValue = e.target.value.replace(/\D/g, '');
                        if (numericValue.length <= 10) {
                          setEditPatient({...editPatient, attenderPhone: numericValue});
                        }
                      }}
                      placeholder="10-digit attender phone number"
                      className="mt-1"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-attender-relationship" className="text-sm font-medium text-gray-700">Attender Relationship</Label>
                    <Input
                      id="edit-attender-relationship"
                      value={editPatient.attenderRelationship || ''}
                      onChange={(e) => setEditPatient({...editPatient, attenderRelationship: e.target.value})}
                      placeholder="e.g., Father, Mother, Spouse"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Main Form Grid Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-1 sm:col-span-2 flex justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-muted border">
                  {(() => {
                    // Show preview of newly selected photo if available, otherwise show existing photo
                    if (editDocuments.photo) {
                      // Show preview of newly selected file
                      const previewUrl = getPreviewUrl(editDocuments.photo, 'main-photo-preview');
                      return (
                        <img 
                          src={previewUrl}
                          alt={`${editPatient.name} - New Photo Preview`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      );
                    } else if (editPatient.photo && editPatient.photo.trim() !== '') {
                      // Show existing photo from database
                      return (
                        <img 
                          src={editPatient.photo.startsWith('data:') ? editPatient.photo : getPatientPhotoUrl(editPatient.photo)} 
                          alt={editPatient.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                  <div 
                    className={`w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-medium ${(editDocuments.photo || (editPatient.photo && editPatient.photo.trim() !== '')) ? 'hidden' : 'flex'}`}
                  >
                    {editPatient.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              
              {/* Profile Photo Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                    <p className="text-sm text-gray-600">Update patient profile picture</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      id="edit-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleEditFileUpload('photo', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label
                      htmlFor="edit-photo-upload"
                      className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-md border transition-colors text-sm shadow-sm ${
                        editDocuments.photo 
                          ? 'bg-green-50 hover:bg-green-100 border-green-300 text-green-700' 
                          : 'bg-white hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {editDocuments.photo 
                          ? `✓ ${editDocuments.photo.name}` 
                          : 'Choose new photo'
                        }
                      </span>
                    </Label>
                    {editDocuments.photo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditFileUpload('photo', null)}
                        className="bg-white hover:bg-gray-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Photo Status Indicator */}
                {editDocuments.photo && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-700 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      New photo selected - will be saved when you update the patient
                    </p>
                  </div>
                )}
              </div>

              {/* Dates Information Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Important Dates</h3>
                    <p className="text-sm text-gray-600">Admission and birth date information</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-admission-date" className="text-sm font-medium text-gray-700">
                      Admission Date<span className="text-red-500"> *</span>
                    </Label>
                    <Input
                      id="edit-admission-date"
                      type="date"
                      required
                      value={editPatient ? (formatDateForInput(editPatient.admissionDate) || '') : ''}
                      onChange={(e) => {
                        if (editPatient) {
                          const date = e.target.value ? parseDateFromInput(e.target.value) : null;
                          setEditPatient({ ...editPatient, admissionDate: date });
                        }
                      }}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  {/* Date of Birth removed from here as it's already in Personal Information section */}
                </div>
              </div>

              {/* Extended Family Information Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-purple-50 to-violet-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-2 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Extended Family & Status</h3>
                    <p className="text-sm text-gray-600">Parents details and employment status</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-father-name" className="text-sm font-medium text-gray-700">Father's Name</Label>
                    <Input
                      id="edit-father-name"
                      value={editPatient.fatherName || ''}
                      onChange={(e) => setEditPatient({...editPatient, fatherName: e.target.value})}
                      className="bg-white border-gray-300"
                      placeholder="Enter father's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mother-name" className="text-sm font-medium text-gray-700">Mother's Name</Label>
                    <Input
                      id="edit-mother-name"
                      value={editPatient.motherName || ''}
                      onChange={(e) => setEditPatient({...editPatient, motherName: e.target.value})}
                      className="bg-white border-gray-300"
                      placeholder="Enter mother's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-marriage-status" className="text-sm font-medium text-gray-700">Marriage Status</Label>
                    <Select
                      value={editPatient.marriageStatus || ''}
                      onValueChange={(value) => setEditPatient({...editPatient, marriageStatus: value})}
                    >
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employee-status" className="text-sm font-medium text-gray-700">Employee Status</Label>
                    <Select
                      value={editPatient.employeeStatus || ''}
                      onValueChange={(value) => setEditPatient({...editPatient, employeeStatus: value})}
                    >
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Non-Employee">Non-Employee</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 sm:p-6 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-2 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                    <p className="text-sm text-gray-600">Fees, charges and payment details</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fees" className="text-sm font-medium text-gray-700">Fees</Label>
                    <Input
                      id="edit-fees"
                      type="number"
                      value={editPatient.fees || 0}
                      onChange={(e) => {
                        const fees = parseFloat(e.target.value) || 0;
                        const bloodTest = editPatient.bloodTest || 0;
                        const pickupCharge = editPatient.pickupCharge || 0;
                        const totalAmount = fees + bloodTest + pickupCharge;
                        const payAmount = editPatient.payAmount || 0;
                        const balance = totalAmount - payAmount;
                        setEditPatient({
                          ...editPatient, 
                          fees, 
                          totalAmount, 
                          balance
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-blood-test" className="text-sm font-medium text-gray-700">Blood Test</Label>
                    <Input
                      id="edit-blood-test"
                      type="number"
                      value={editPatient.bloodTest || 0}
                      onChange={(e) => {
                        const bloodTest = parseFloat(e.target.value) || 0;
                        const fees = editPatient.fees || 0;
                        const pickupCharge = editPatient.pickupCharge || 0;
                        const totalAmount = fees + bloodTest + pickupCharge;
                        const payAmount = editPatient.payAmount || 0;
                        const balance = totalAmount - payAmount;
                        setEditPatient({
                          ...editPatient, 
                          bloodTest, 
                          totalAmount, 
                          balance
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pickup-charge" className="text-sm font-medium text-gray-700">Pickup Charge</Label>
                    <Input
                      id="edit-pickup-charge"
                      type="number"
                      value={editPatient.pickupCharge || 0}
                      onChange={(e) => {
                        const pickupCharge = parseFloat(e.target.value) || 0;
                        const fees = editPatient.fees || 0;
                        const bloodTest = editPatient.bloodTest || 0;
                        const totalAmount = fees + bloodTest + pickupCharge;
                        const payAmount = editPatient.payAmount || 0;
                        const balance = totalAmount - payAmount;
                        setEditPatient({
                          ...editPatient, 
                          pickupCharge, 
                          totalAmount, 
                          balance
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-total-amount" className="text-sm font-medium text-gray-700">Total Amount</Label>
                    <Input
                      id="edit-total-amount"
                      type="number"
                      value={editPatient.totalAmount || 0}
                      disabled
                      className="bg-gray-100 border-gray-300 text-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pay-amount" className="text-sm font-medium text-gray-700">Pay Amount</Label>
                    <Input
                      id="edit-pay-amount"
                      type="number"
                      value={editPatient.payAmount || 0}
                      onChange={(e) => {
                        const payAmount = parseFloat(e.target.value) || 0;
                        const totalAmount = editPatient.totalAmount || 0;
                        const balance = totalAmount - payAmount;
                        setEditPatient({
                          ...editPatient, 
                          payAmount, 
                          balance
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-balance" className="text-sm font-medium text-gray-700">Balance</Label>
                    <Input
                      id="edit-balance"
                      type="number"
                      value={editPatient.balance || 0}
                      disabled
                      className="bg-gray-100 border-gray-300 text-gray-600"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="edit-payment-type" className="text-sm font-medium text-gray-700">Payment Type</Label>
                    <Select
                      value={editPatient.paymentType || ''}
                      onValueChange={(value) => setEditPatient({...editPatient, paymentType: value})}
                    >
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Net Banking">Net Banking</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Medical History Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-rose-50 to-pink-50 p-4 sm:p-6 rounded-lg border border-rose-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-2 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
                    <p className="text-sm text-gray-600">Patient's medical background and conditions</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-medical-history" className="text-sm font-medium text-gray-700">Medical History Details</Label>
                  <Textarea
                    id="edit-medical-history"
                    value={editPatient.medicalHistory}
                    onChange={(e) => setEditPatient({...editPatient, medicalHistory: e.target.value})}
                    className="bg-white border-gray-300 min-h-[100px]"
                    placeholder="Enter patient's medical history, allergies, previous treatments, etc."
                  />
                </div>
              </div>
              
              {/* Patient Documents Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-2 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Patient Documents</h3>
                    <p className="text-sm text-gray-600">Upload patient identification documents</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Patient Aadhar Card"
                    currentFile={editPatient.patientAadhar}
                    uploadedFile={editDocuments.patientAadhar}
                    onFileChange={(file) => handleEditFileUpload('patientAadhar', file)}
                    accept="image/*"
                  />
                  <FileUploadField
                    label="Patient PAN Card"
                    currentFile={editPatient.patientPan}
                    uploadedFile={editDocuments.patientPan}
                    onFileChange={(file) => handleEditFileUpload('patientPan', file)}
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Attender Documents Section */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-teal-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-2 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Attender Documents</h3>
                    <p className="text-sm text-gray-600">Upload attender identification documents</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Attender Aadhar Card"
                    currentFile={editPatient.attenderAadhar}
                    uploadedFile={editDocuments.attenderAadhar}
                    onFileChange={(file) => handleEditFileUpload('attenderAadhar', file)}
                    accept="image/*"
                  />
                  <FileUploadField
                    label="Attender PAN Card"
                    currentFile={editPatient.attenderPan}
                    uploadedFile={editDocuments.attenderPan}
                    onFileChange={(file) => handleEditFileUpload('attenderPan', file)}
                    accept="image/*"
                  />
                </div>
              </div>
              </div> {/* Close Main Form Grid Container */}
              
           
            </form>
            
            <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setEditPatient(null)} 
                className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSaveEdit} 
                className="editpopup form footer-button-save w-full sm:w-auto global-btn"
              >
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog - Centered */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title text-red-700">
                  Delete Patient
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this patient? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {deletePatient && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{deletePatient.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Contact className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">ID: {deletePatient.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deletePatient.phone || 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">⚠️ This will also permanently delete:</p>
                  <ul className="text-xs space-y-1">
                    <li>• All patient attendance records</li>
                    <li>• All patient history records</li>
                    <li>• All patient payment records</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Delete Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Month/Year Picker Dialog */}
      <MonthYearPickerDialog
        open={showMonthYearDialog}
        onOpenChange={setShowMonthYearDialog}
        selectedMonth={filterMonth || currentMonth}
        selectedYear={filterYear || currentYear}
        onMonthChange={setFilterMonth}
        onYearChange={setFilterYear}
        onApply={() => {
          setShowMonthYearDialog(false);
        }}
        title="Select Month & Year"
        description="Filter patients by admission date"
        previewText="patients"
      />
      
      </div>
    </div>
  );
};

export default PatientList;
