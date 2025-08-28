import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatabaseService } from '../../services/databaseService';
import CallRecordService from '../../services/callRecordService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { toast } from '../../hooks/use-toast';
import { FileText, Search, Download, Edit2, Loader2, Play, Pause, RefreshCw, Trash2, Eye, Pencil, Mic, Square, File as FileIcon, User, Phone, Calendar, X, Users, Contact } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Textarea } from '../../components/ui/textarea';
import { uploadMedicalHistoryFile, uploadCallRecordAudio, getFileUrl } from '../../services/simpleFileUpload';

type AudioRecording = {
  blob: Blob;
  url: string;
  duration: number;
};

interface Patient {
  id: string;
  name: string;
  admissionDate?: Date;
  age: string;
  gender: string;
  contactNumber: string;
  address: string;
  locality: string;
  city: string;
  bloodGroup: string;
  occupation: string;
  guardian: string;
  guardianPhone: string;
  referredBy: string;
  uhid: string;
  photo: string;
  photoUrl: string;
  status: string;
}

interface CallRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  description: string;
  audioRecording?: {
    blob: Blob | null;
    url: string;
    duration: number;
  };
  audioFiles: File[];
  createdAt: string;
}

const PatientCallRecord: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]); // Store actual call records from database
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isUpdatingRecords, setIsUpdatingRecords] = useState(false);
  
  // Loading states for better UX
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  // Month and year state for view dialog filtering
  const [viewDialogSelectedMonth, setViewDialogSelectedMonth] = useState(currentMonth);
  const [viewDialogSelectedYear, setViewDialogSelectedYear] = useState(currentYear);
  const [showViewDialogMonthYearDialog, setShowViewDialogMonthYearDialog] = useState(false);
  const [viewDialogFilterMonth, setViewDialogFilterMonth] = useState<number | null>(null);
  const [viewDialogFilterYear, setViewDialogFilterYear] = useState<number | null>(null);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<CallRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<CallRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<CallRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioRecording, setAudioRecording] = useState<{blob: Blob, url: string, duration: number} | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null); // Pre-selected patient
  const [formData, setFormData] = useState({
    patientId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    audioFiles: [] as File[]
  });

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterYear]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to format patient ID as P0001
  const formatPatientId = (id: string | number): string => {
    // Convert to number, removing any existing P prefix and leading zeros
    const numericId = typeof id === 'string' ? parseInt(id.replace(/^P0*/, '')) : id;
    return `P${numericId.toString().padStart(4, '0')}`;
  };

  // Helper function to get patient image URL with proxy
  const getPatientImageUrl = (photo: string | undefined | null): string => {
    if (!photo) return '';
    
    // If it's base64 data, return as is
    if (photo.startsWith('data:image/')) {
      return photo;
    }
    
    // If it's already a full URL, return as is
    if (photo.startsWith('http')) {
      return photo;
    }
    
    // Use the existing getFileUrl service for consistent URL handling
    return getFileUrl(photo);
  };

  // Audio file upload handler (like PatientHistory)
  const handleAudioFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const maxSize = 500 * 1024 * 1024; // 500MB limit like PatientHistory
      
      // Check file sizes
      const invalidFiles = newFiles.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: `Files larger than 500MB are not allowed. Please select smaller files.`,
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        audioFiles: [...prev.audioFiles, ...newFiles]
      }));
    }
  };

  const removeAudioFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      audioFiles: prev.audioFiles.filter((_, i) => i !== index)
    }));
  };

  // Auto-set patient ID when viewing patient details
  useEffect(() => {
    if (viewRecord && viewRecord.patientId) {
      console.log('🎯 Auto-setting patient ID for view dialog:', viewRecord.patientId);
      setFormData(prev => ({ ...prev, patientId: String(viewRecord.patientId) }));
    }
  }, [viewRecord]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load for PatientCallRecord...');
        // Load all data in parallel for better performance
        const [patientsResult, recordsResult] = await Promise.allSettled([
          loadPatients(),
          loadCallRecords()
        ]);
        
        // Handle any failed promises
        if (patientsResult.status === 'rejected') {
          console.error('Failed to load patients:', patientsResult.reason);
        }
        if (recordsResult.status === 'rejected') {
          console.error('Failed to load records:', recordsResult.reason);
        }
        
        console.log('Data loading completed for PatientCallRecord');
        setIsLoadingComplete(true);
      } catch (error) {
        console.error('Error in loadData:', error);
        setIsLoadingComplete(true);
      }
    };
    loadData();
  }, []);

  // Optimized filtering with useMemo (same as PatientHistory)
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filter to show only active patients (same logic as PatientHistory)
    filtered = filtered.filter(record => {
      const patient = patients.find(p => String(p.id) === String(record.patientId));
      // Handle both 'Active' and 'active' status values
      return patient && (patient.status === 'Active' || patient.status === 'active');
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const patient = patients.find(p => String(p.id) === String(record.patientId));
        return record.patientName.toLowerCase().includes(searchLower) ||
               record.description.toLowerCase().includes(searchLower) ||
               record.patientId.toLowerCase().includes(searchLower) ||
               (patient?.contactNumber && patient.contactNumber.toLowerCase().includes(searchLower)) ||
               (patient?.uhid && patient.uhid.toLowerCase().includes(searchLower));
      });
    }

    // Month & Year filtering (same as PatientHistory)
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === (filterMonth - 1) && recordDate.getFullYear() === filterYear;
      });
    }

    // Sort by Patient ID in ascending order (P0001, P0002, P0003, etc.)
    filtered.sort((a, b) => {
      // Extract numeric part from patient ID for proper sorting
      const getNumericId = (patientId: string ) => {
          if (patientId === null || patientId === undefined) return 0;
        const strId = typeof patientId === 'string' ? patientId : String(patientId);          
        const numericPart = strId.replace(/^P0*/, ''); // Remove P prefix and leading zeros
        return parseInt(numericPart) || 0;
      };
      

//       const getNumericIds = (patientId: string | number | null | undefined) => {
//   if (patientId === null || patientId === undefined) return 0;

//   const strId = typeof patientId === 'string' ? patientId : String(patientId);
//   const numericPart = strId.replace(/^P0*/, '');
//   return parseInt(numericPart) || 0;
// };

      const aId = getNumericId(a.patientId);
      const bId = getNumericId(b.patientId);
      
      return aId - bId; // Ascending order
    });

    return filtered;
  }, [records, patients, searchTerm, filterMonth, filterYear]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get call records for the viewed patient (filtered by view dialog month/year)
  const viewedPatientCallRecords = useMemo(() => {
    if (!viewRecord) return [];
    
    // Use actual call records from database, not the placeholder patient records
    let patientRecords = callRecords.filter(record => {
      // Handle both 'P0042' format and '42' format for patient ID matching
      const viewPatientId = String(viewRecord.patientId).replace(/^P0*/, ''); // Remove P prefix and leading zeros
      const recordPatientId = String(record.patientId).replace(/^P0*/, ''); // Remove P prefix and leading zeros
      return viewPatientId === recordPatientId;
    });

    // Apply view dialog month/year filtering if both month and year are set
    if (viewDialogFilterMonth !== null && viewDialogFilterYear !== null) {
      patientRecords = patientRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === (viewDialogFilterMonth - 1) && recordDate.getFullYear() === viewDialogFilterYear;
      });
    }

    // Sort by date (newest first)
    patientRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return patientRecords;
  }, [callRecords, viewRecord?.patientId, refreshCounter, viewDialogFilterMonth, viewDialogFilterYear]);

  const handleView = (record: CallRecord) => {
    setViewRecord(record);
  };

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      console.log('Loading patients from DatabaseService...');
      const data = await DatabaseService.getAllPatients();
      
      // Use the same parsing logic as PatientHistory component to ensure consistency
      const parsedPatients = data.map((p: any) => {
        // Safely parse dates with validation - use created_at as fallback for admission date
        const parseDate = (dateValue: any) => {
          if (!dateValue) return null;
          const parsedDate = new Date(dateValue);
          return isNaN(parsedDate.getTime()) ? null : parsedDate;
        };
        
        // Get admission date with fallback to created_at
        const getAdmissionDate = (p: any) => {
          return parseDate(p.admissionDate || p.admission_date) || parseDate(p.created_at) || null;
        };
        
        // Format ID as string and ensure it exists
        const patientId = p.id ? String(p.id) : '';
        return {
          id: patientId,
          name: p.name,
          age: parseInt(p.age) || 0,
          gender: p.gender,
          phone: p.phone,
          email: p.email || '',
          address: p.address,
          emergencyContact: p.emergency_contact || '',
          medicalHistory: p.medical_history || '',
          admissionDate: getAdmissionDate(p),
          status: p.status || 'Active', // Default to 'Active' like PatientHistory
          attenderName: p.attender_name || '',
          attenderPhone: p.attender_phone || '',
          photo: p.photo || '',
          fees: parseFloat(p.fees) || 0,
          bloodTest: parseFloat(p.blood_test) || 0,
          pickupCharge: parseFloat(p.pickup_charge) || 0,
          totalAmount: parseFloat(p.total_amount) || 0,
          payAmount: parseFloat(p.pay_amount) || 0,
          balance: parseFloat(p.balance) || 0,
          paymentType: p.payment_type || '',
          fatherName: p.father_name || '',
          motherName: p.mother_name || '',
          attenderRelationship: p.attender_relationship || '',
          dateOfBirth: parseDate(p.date_of_birth),
          marriageStatus: p.marriage_status || '',
          employeeStatus: p.employee_status || '',
          created_at: parseDate(p.created_at),
          createdAt: parseDate(p.created_at),
          // Additional fields for call record compatibility
          contactNumber: p.contact_number || p.phone || '',
          locality: p.locality || '',
          city: p.city || '',
          bloodGroup: p.blood_group || '',
          occupation: p.occupation || '',
          guardian: p.guardian || '',
          guardianPhone: p.guardian_phone || '',
          referredBy: p.referred_by || '',
          uhid: p.uhid || '',
          photoUrl: p.photo_url || ''
        };
      });
      
      setPatients(parsedPatients);
      console.log('Patients loaded successfully:', parsedPatients.length);
    } catch (error) {
      console.error('Error loading patients:', error);
      
      // Fallback: Try to load from localStorage as backup (same as PatientHistory)
      const stored = localStorage.getItem('patients');
      if (stored) {
        try {
          const parsedPatients = JSON.parse(stored).map((p: any) => ({
            id: p.id,
            name: p.name,
            age: p.age || 0,
            gender: p.gender || '',
            phone: p.phone || '',
            email: p.email || '',
            address: p.address || '',
            emergencyContact: p.emergencyContact || '',
            medicalHistory: p.medicalHistory || '',
            admissionDate: p.admissionDate ? new Date(p.admissionDate) : undefined,
            status: p.status || 'Active',
            attenderName: p.attenderName || '',
            attenderPhone: p.attenderPhone || '',
            photo: p.photo || '',
            fees: p.fees || 0,
            bloodTest: p.bloodTest || 0,
            pickupCharge: p.pickupCharge || 0,
            totalAmount: p.totalAmount || 0,
            payAmount: p.payAmount || 0,
            balance: p.balance || 0,
            paymentType: p.paymentType || '',
            fatherName: p.fatherName || '',
            motherName: p.motherName || '',
            attenderRelationship: p.attenderRelationship || '',
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : new Date(),
            marriageStatus: p.marriageStatus || '',
            employeeStatus: p.employeeStatus || '',
            contactNumber: p.contactNumber || p.phone || '',
            locality: p.locality || '',
            city: p.city || '',
            bloodGroup: p.bloodGroup || '',
            occupation: p.occupation || '',
            guardian: p.guardian || '',
            guardianPhone: p.guardianPhone || '',
            referredBy: p.referredBy || '',
            uhid: p.uhid || '',
            photoUrl: p.photoUrl || ''
          }));
          
          setPatients(parsedPatients);
          toast({
            title: "Using Local Data",
            description: "Loaded patients from local storage due to database connection issue",
            variant: "default",
          });
          return;
        } catch (e) {
          console.error('Failed to parse local storage patients:', e);
        }
      }
      
      // If no data available, set empty array
      setPatients([]);
      
      toast({
        title: "Error",
        description: `Failed to load patients: ${error}. No patient data available.`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadCallRecords = async () => {
    setIsLoadingRecords(true);
    try {
      console.log('Loading call records from CallRecordService...');
      
      // Get all patient history records from database (using same logic as PatientHistory)
      const callRecordsData = await CallRecordService.getAllPatientCallRecords();
      
      // Convert database format to component format
      const mappedCallRecords = (callRecordsData && Array.isArray(callRecordsData) ? callRecordsData : []).map((record: any) => {
        console.log('🎵 Processing call record:', record.id, 'audio_file_path:', record.audio_file_path, 'audio_file_name:', record.audio_file_name);
        
        let audioUrl = '';
        if (record.audio_file_path) {
          // Use getFileUrl service to handle proper URL construction
          audioUrl = getFileUrl(record.audio_file_path);
        } else if (record.audio_file_name) {
          // Fallback: construct path for call records folder and use getFileUrl
          const fallbackPath = `Photos/Patient Call Records/${record.patient_id}/audio/${record.audio_file_name}`;
          audioUrl = getFileUrl(fallbackPath);
        }
        
        console.log('🔗 Constructed audio URL:', audioUrl);
        
        return {
          id: record.id,
          patientId: record.patient_id,
          patientName: record.patient_name,
          date: record.date,
          description: record.description,
          audioRecording: audioUrl ? {
            blob: null,
            url: audioUrl,
            duration: record.audio_duration || 0
          } : undefined,
          audioFiles: record.audio_file_name ? [{ name: record.audio_file_name } as File] : [],
          createdAt: record.created_at
        };
      });

      // Store the actual call records separately for the view popup
      setCallRecords(mappedCallRecords);

      // Get patients data efficiently - use current state if available, otherwise fetch fresh
      let allPatients = patients;
      if (allPatients.length === 0) {
        try {
          const data = await DatabaseService.getAllPatients();
          allPatients = data.map((p: any) => {
            const parseDate = (dateValue: any) => {
              if (!dateValue) return null;
              const parsedDate = new Date(dateValue);
              return isNaN(parsedDate.getTime()) ? null : parsedDate;
            };
            return {
              id: p.id,
              name: p.name,
              admissionDate: parseDate(p.admissionDate || p.admission_date || p.created_at),
              status: p.status || 'Active' // Default to 'Active' like PatientHistory
            };
          });
        } catch (error) {
          console.error('Error loading patients for call records:', error);
          allPatients = [];
        }
      }

      // Create patient list records exactly like PatientHistory
      const patientListRecords: CallRecord[] = [];
      
      // For ALL patients, create basic patient registration entries for main table display
      allPatients.forEach(patient => {
        // Find the latest call record for this patient (if any)
        const latestCallRecord = mappedCallRecords
          .filter(record => String(record.patientId) === String(patient.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        // Create patient registration entry for main table (same as PatientHistory)
        patientListRecords.push({
          id: `patient_${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          date: new Date().toISOString().split('T')[0],
          description: latestCallRecord ? latestCallRecord.description : `Patient ${patient.name} registered in the system.`,
          audioRecording: latestCallRecord?.audioRecording,
          audioFiles: latestCallRecord?.audioFiles || [],
          createdAt: new Date().toISOString()
        });
      });

      // Sort by date (newest first) like PatientHistory
      patientListRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecords(patientListRecords);
      console.log('Patient list with call records loaded successfully:', patientListRecords.length);
      console.log('Actual call records loaded:', mappedCallRecords.length);
    } catch (error) {
      console.error('Error loading patient list:', error);
      // Set empty array when database fails
      setRecords([]);
      setCallRecords([]);
      toast({
        title: "Note",
        description: "Failed to load patient list from database",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleDelete = async (record: CallRecord) => {
    if (!record || !record.id) {
      toast({
        title: "Error",
        description: "Invalid record data",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show loading state
      setIsLoadingRecords(true);

      // Delete record and associated audio file
      const deleted = await CallRecordService.deletePatientCallRecord(record.id);
      
      if (!deleted) {
        throw new Error('Failed to delete the record');
      }
      
      // Refresh the records list
      await loadCallRecords();
      setRefreshCounter(prev => prev + 1);
      
      toast({
        title: "Success",
        description: "Call record has been successfully deleted.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error deleting call record:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete call record. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Always ensure loading state is cleared
      setIsLoadingRecords(false);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioRecording({
          blob,
          url,
          duration: recordingTime
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not start audio recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playAudio = (audioUrl: string, recordId: string) => {
    console.log('🎵 Attempting to play audio:', audioUrl);
    
    if (!audioUrl) {
      console.error('❌ No audio URL provided');
      toast({
        title: "Audio Error",
        description: "No audio file available for this record.",
        variant: "destructive",
      });
      return;
    }

    if (playingAudio === recordId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      
      // Add error handling
      audioRef.current.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        toast({
          title: "Audio Error",
          description: "Failed to load or play the audio file. The file may not exist or be corrupted.",
          variant: "destructive",
        });
        setPlayingAudio(null);
      };
      
      audioRef.current.onloadstart = () => {
        console.log('🔄 Loading audio...');
      };
      
      audioRef.current.oncanplay = () => {
        console.log('✅ Audio loaded successfully');
      };
      
      audioRef.current.playbackRate = playbackSpeed;
      
      // Try to play
      audioRef.current.play().then(() => {
        console.log('✅ Audio playing successfully');
        setPlayingAudio(recordId);
      }).catch((error) => {
        console.error('❌ Audio play failed:', error);
        toast({
          title: "Audio Error",
          description: "Failed to play the audio file. Please check if the file exists.",
          variant: "destructive",
        });
        setPlayingAudio(null);
      });
      
      audioRef.current.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(null);
    }
  };

  const downloadAudio = (audioUrl: string, filename: string) => {
    console.log('📥 Attempting to download audio:', audioUrl);
    
    if (!audioUrl) {
      console.error('❌ No audio URL provided for download');
      toast({
        title: "Download Error",
        description: "No audio file available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use fetch to get the file as blob and force download
      fetch(audioUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.blob();
        })
        .then(blob => {
          // Create blob URL and download
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          a.download = `${filename}.wav`;
          
          // Add to DOM, click, and remove
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up blob URL
          window.URL.revokeObjectURL(blobUrl);
          
          console.log('✅ Download completed successfully');
          toast({
            title: "Download Started",
            description: "Audio file download has been initiated.",
            variant: "default",
          });
        })
        .catch(error => {
          console.error('❌ Download failed:', error);
          toast({
            title: "Download Error", 
            description: "The audio file could not be downloaded. It may have been moved or deleted.",
            variant: "destructive",
          });
        });
        
    } catch (error) {
      console.error('❌ Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download the audio file.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFromViewPopup = async (record: CallRecord) => {
    setDeleteRecord(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;
    
    await handleDelete(deleteRecord);
    setDeleteRecord(null);
    setShowDeleteConfirm(false);
    // Refresh the viewed patient records
    setRefreshCounter(prev => prev + 1);
  };

  const handleSubmit = async () => {
    console.log('🚀 Add Record button clicked');
    console.log('📝 Form Data:', formData);
    console.log('👤 Selected Patient ID:', selectedPatientId);
    console.log('🎵 Audio Recording:', audioRecording);
    
    if (!formData.patientId || !formData.date) {
      console.log('❌ Validation failed - missing required fields');
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Patient and Date).",
        variant: "destructive",
      });
      return;
    }

    const patient = patients.find(p => String(p.id) === String(formData.patientId));
    if (!patient) {
      console.error('Patient not found for ID:', formData.patientId);
      console.log('Available patients:', patients.map(p => ({ id: p.id, name: p.name })));
      toast({
        title: "Patient Error",
        description: "Selected patient not found. Please try selecting the patient again.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Found patient:', patient.name, 'ID:', patient.id);

    try {
      const isEditing = editRecord !== null;
      const recordId = isEditing ? editRecord.id : `call_${Date.now()}`;
      
      let audioFilePath = null;
      let audioFileName = null;
      let audioDuration = 0;

      // Handle recorded audio (convert blob to file and upload like PatientHistory)
      if (audioRecording) {
        try {
          audioFileName = `patient-${formData.patientId}-call-${Date.now()}.wav`;
          audioDuration = audioRecording.duration;
          
          // Create file from blob and upload to server
          const audioFile = new File([audioRecording.blob], audioFileName, { type: 'audio/wav' });
          audioFilePath = await uploadCallRecordAudio(audioFile, formData.patientId);
          console.log('âœ… Recorded audio uploaded:', audioFilePath);
        } catch (error) {
          console.error('âŒ Audio upload error:', error);
          throw error;
        }
      }

      // Handle uploaded audio files - use the first one if recorded audio doesn't exist (like PatientHistory)
      if (!audioRecording && formData.audioFiles.length > 0) {
        try {
          const firstAudioFile = formData.audioFiles[0];
          audioFilePath = await uploadCallRecordAudio(firstAudioFile, formData.patientId);
          audioFileName = firstAudioFile.name;
          audioDuration = 0; // Duration will be calculated later if needed
          console.log('âœ… Audio file uploaded:', audioFilePath);
        } catch (error) {
          console.error('âŒ Audio file upload failed:', error);
          throw error;
        }
      }

      // Create the record data (no FormData needed, just JSON like PatientHistory)
      const dbRecord = {
        id: recordId,
        patient_id: formData.patientId,
        patient_name: patient.name,
        date: formData.date,
        description: formData.description,
        audio_file_path: audioFilePath, // Server file path
        audio_file_name: audioFileName,
        audio_duration: audioDuration
      };

      console.log('💾 About to save DB record:', dbRecord);

      // Send JSON data directly (not FormData)
      if (isEditing) {
        console.log('🔄 Updating existing record...');
        await CallRecordService.updatePatientCallRecord(recordId, dbRecord);
        toast({
          title: "Record Updated",
          description: "Call record has been successfully updated.",
        });
      } else {
        console.log('➕ Adding new record...');
        await CallRecordService.addPatientCallRecord(dbRecord);
        toast({
          title: "Record Added",
          description: "Call record has been successfully added.",
        });
      }

      console.log('✅ Record saved successfully!');

      setIsUpdatingRecords(true);
      await loadCallRecords();
      setIsUpdatingRecords(false);
      setRefreshCounter(prev => prev + 1);

      setShowAddDialog(false);
      setEditRecord(null);
      resetForm();

    } catch (error) {
      console.error('Error saving call record:', error);
      toast({
        title: "Error",
        description: `Failed to ${editRecord ? 'update' : 'save'} call record.`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: CallRecord) => {
    setEditRecord({ ...record });
    setFormData({
      patientId: record.patientId,
      description: record.description,
      date: record.date || new Date().toISOString().split('T')[0],
      audioFiles: record.audioFiles || []
    });
    
    // Set selected patient (will make field non-editable)
    setSelectedPatientId(record.patientId);
    
    if (record.audioRecording) {
      setAudioRecording(record.audioRecording);
    }
    
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      audioFiles: []
    });
    setAudioRecording(null);
    setRecordingTime(0);
    setEditRecord(null);
    setSelectedPatientId(null); // Clear selected patient
  };

  const openAddDialogForPatient = (patientId: string) => {
    resetForm();
    setSelectedPatientId(patientId);
    setFormData(prev => ({ ...prev, patientId }));
    setShowAddDialog(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportExcel = () => {
    const data = filteredRecords.map((record, index) => {
      const patient = patients.find(p => String(p.id) === String(record.patientId));
      return {
        'S NO': index + 1,
        'Patient ID': record.patientId,
        'Patient Name': record.patientName,
        'Contact Number': patient?.contactNumber || 'N/A',
        'UHID': patient?.uhid || 'N/A',
        'Status': patient?.status || 'Unknown',
        'Call Date': format(new Date(record.date), 'dd/MM/yyyy'),
        'Description': record.description,
        'Has Audio': record.audioRecording ? 'Yes' : 'No',
        'Audio Duration': record.audioRecording ? formatDuration(record.audioRecording.duration) : 'N/A'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Call Records');
    XLSX.writeFile(wb, `patient_call_records_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const handleExportPDF = () => {
    // Implement PDF export functionality
    toast({
      title: "Coming Soon",
      description: "PDF export functionality will be available soon.",
      variant: "default",
    });
  };

  return (
    <div className="crm-page-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="crm-header-icon">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patients Call Record</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <ActionButtons.Refresh onClick={() => {
              console.log('🔄 Manual refresh triggered - refreshing entire page');
              window.location.reload();
            }} />
            
            <ActionButtons.MonthYear
              text={`${months[(filterMonth || 1) - 1]} ${filterYear}`}
              onClick={() => setShowMonthYearDialog(true)}
            />
            
            <Button 
              onClick={() => {
                console.log('🔵 Add Record button clicked');
                setShowAddDialog(true);
              }}
              className="global-btn global-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
            >
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Record</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6">
        
        {/* Active Patients Card */}
        <Card className="crm-stat-card crm-stat-card-blue">
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Active Patients</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                  {(() => {
                    // Filter active patients based on call records that match the month/year filter
                    let activePatientIds = new Set();
                    let filteredCallRecords = callRecords;
                    
                    // Apply month & year filtering
                    if (filterMonth !== null && filterYear !== null) {
                      filteredCallRecords = filteredCallRecords.filter(record => {
                        const recordDate = new Date(record.date);
                        return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
                      });
                    }
                    
                    // Get unique patient IDs from filtered call records
                    filteredCallRecords.forEach(record => {
                      const patient = patients.find(p => String(p.id) === String(record.patientId));
                      if (patient && patient.status === 'Active') {
                        activePatientIds.add(record.patientId);
                      }
                    });
                    
                    return activePatientIds.size;
                  })()}
                </p>
                <div className="flex items-center text-xs text-blue-600">
                  <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">With calls</span>
                </div>
              </div>
              <div className="crm-stat-icon crm-stat-icon-blue">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Files Card */}
        <Card className="crm-stat-card crm-stat-card-green">
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Audio Files</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                  {(() => {
                    let totalAudioCount = 0;
                    // Count audio files from call records
                    let filteredCallRecords = callRecords;
                    
                    // Apply same filtering as main table
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      filteredCallRecords = filteredCallRecords.filter(record =>
                        record.description.toLowerCase().includes(searchLower) ||
                        record.patientName.toLowerCase().includes(searchLower) ||
                        String(record.patientId).toLowerCase().includes(searchLower)
                      );
                    }

                    // Month & Year filtering
                    if (filterMonth !== null && filterYear !== null) {
                      filteredCallRecords = filteredCallRecords.filter(record => {
                        const recordDate = new Date(record.date);
                        return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
                      });
                    }

                    // Filter to show only active patients
                    filteredCallRecords = filteredCallRecords.filter(record => {
                      const patient = patients.find(p => String(p.id) === String(record.patientId));
                      return patient && patient.status === 'Active';
                    });

                    filteredCallRecords.forEach(record => {
                      // Count audio recordings
                      if (record.audioRecording) {
                        totalAudioCount += 1;
                      } else if (record.audioFiles && record.audioFiles.length > 0) {
                        totalAudioCount += record.audioFiles.length;
                      }
                    });
                    return totalAudioCount;
                  })()}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <Mic className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Recordings</span>
                </div>
              </div>
              <div className="crm-stat-icon crm-stat-icon-green">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Records Card */}
        <Card className="crm-stat-card crm-stat-card-purple">
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Call Records</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
                  {(() => {
                    // Count call records
                    let filteredCallRecords = callRecords;
                    
                    // Apply same filtering as main table
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      filteredCallRecords = filteredCallRecords.filter(record =>
                        record.description.toLowerCase().includes(searchLower) ||
                        record.patientName.toLowerCase().includes(searchLower) ||
                        String(record.patientId).toLowerCase().includes(searchLower)
                      );
                    }

                    // Month & Year filtering
                    if (filterMonth !== null && filterYear !== null) {
                      filteredCallRecords = filteredCallRecords.filter(record => {
                        const recordDate = new Date(record.date);
                        return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
                      });
                    }

                    // Filter to show only active patients
                    filteredCallRecords = filteredCallRecords.filter(record => {
                      const patient = patients.find(p => String(p.id) === String(record.patientId));
                      return patient && patient.status === 'Active';
                    });

                    return filteredCallRecords.length;
                  })()}
                </p>
                <div className="flex items-center text-xs text-purple-600">
                  <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Total calls</span>
                </div>
              </div>
              <div className="crm-stat-icon crm-stat-icon-purple">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="crm-controls-container">
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search call records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="crm-table-container">
        <div className="crm-table-header">
          <div className="crm-table-title">
            <Phone className="crm-table-title-icon" />
            <h2 className="crm-table-title-text">Patients Call Records</h2>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {/* Loading Indicator */}
          {(!isLoadingComplete && (isLoadingPatients || isLoadingRecords)) && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="text-sm text-gray-600">
                  Loading data...
                  {isLoadingPatients && " (Patients)"}
                  {isLoadingRecords && " (Records)"}
                </div>
              </div>
            </div>
          )}
          
          {/* Table Content */}
          {isLoadingComplete && (
            <div className="overflow-x-auto">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <p className="text-lg">No active patients found</p>
                    <p className="text-sm mt-2">Check if patients are marked as active in the system</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">S NO</TableHead>
                      <TableHead className="text-center">Photo</TableHead>
                      <TableHead className="text-center">Patient Id</TableHead>
                      <TableHead className="text-center">Patient Name</TableHead>
                      <TableHead className="text-center">Audio</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((record, idx) => {
                        const patient = patients.find(p => String(p.id) === String(record.patientId));
                        const isPatientRecord = record.id.toString().startsWith('patient_');
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="text-center">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage 
                                    src={getPatientImageUrl(patient?.photo || patient?.photoUrl)} 
                                    alt={record.patientName}
                                  />
                                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                    {(() => {
                                      // Try multiple sources for the patient name
                                      const name = record.patientName || patient?.name || `Patient${record.patientId}`;
                                      // Ensure we have a valid string and get the first character
                                      const firstChar = typeof name === 'string' && name.length > 0 
                                        ? name.charAt(0).toUpperCase() 
                                        : 'P';
                                      return firstChar;
                                    })()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium text-blue-600">{formatPatientId(record.patientId)}</span>
                            </TableCell>
                            <TableCell className="text-center font-semibold">{record.patientName}</TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                // Count actual audio recordings for this patient from callRecords
                                const patientAudioCount = callRecords.filter(callRecord => {
                                  const callPatientId = String(callRecord.patientId).replace(/^P0*/, '');
                                  const currentPatientId = String(record.patientId).replace(/^P0*/, '');
                                  return callPatientId === currentPatientId && callRecord.audioRecording;
                                }).length;

                                return patientAudioCount > 0 ? (
                                  <div className="flex justify-center items-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Find the first audio record for this patient to play
                                        const firstAudioRecord = callRecords.find(callRecord => {
                                          const callPatientId = String(callRecord.patientId).replace(/^P0*/, '');
                                          const currentPatientId = String(record.patientId).replace(/^P0*/, '');
                                          return callPatientId === currentPatientId && callRecord.audioRecording;
                                        });
                                        if (firstAudioRecord?.audioRecording) {
                                          playAudio(firstAudioRecord.audioRecording.url, firstAudioRecord.id);
                                        }
                                      }}
                                      className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full w-8 h-8 p-0"
                                      title={`${patientAudioCount} audio recording${patientAudioCount > 1 ? 's' : ''} available`}
                                    >
                                      <span className="text-sm font-semibold">{patientAudioCount}</span>
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center items-center">
                                    <span className="text-gray-400 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-sm">0</span>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleView(record)}
                                  className="action-btn-lead action-btn-view h-8 w-8 sm:h-9 sm:w-9 p-0 inline-flex items-center justify-center"
                                  title="View Patient Details"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                                
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
          
          {filteredRecords.length > itemsPerPage && isLoadingComplete && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + Math.max(1, currentPage - 2);
                  if (pageNumber > totalPages) return null;
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-8"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editRecord ? 'Edit Call Record' : 'Add New Call Record'}</DialogTitle>
            <DialogDescription>
              {editRecord ? 'Update patient call record details' : 'Create a new patient call record'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                {selectedPatientId ? (
                  // Non-editable patient display when pre-selected
                  <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-700">
                    {(() => {
                      // Try multiple matching strategies to find the patient
                      let patient = patients.find(p => String(p.id) === String(selectedPatientId));
                      
                      if (!patient) {
                        // Try matching with formData.patientId
                        patient = patients.find(p => String(p.id) === String(formData.patientId));
                      }
                      
                      if (!patient) {
                        // Try matching by UHID or other identifiers
                        patient = patients.find(p => 
                          p.uhid === selectedPatientId || 
                          String(p.id).toLowerCase() === String(selectedPatientId).toLowerCase()
                        );
                      }
                      
                      return patient ? `${patient.name} (${patient.id})` : `Unknown Patient (${selectedPatientId})`;
                    })()}
                  </div>
                ) : (
                  // Editable dropdown when no patient pre-selected
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter call description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Audio File Upload */}
            <div className="space-y-2">
              <Label>Upload Audio Files (Multiple files supported, up to 500MB each)</Label>
              <Input
                type="file"
                accept="audio/*"
                multiple
                onChange={(e) => handleAudioFileUpload(e.target.files)}
              />
              {formData.audioFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  <Label className="text-sm font-medium">Uploaded Audio Files ({formData.audioFiles.length}):</Label>
                  {formData.audioFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <FileIcon className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAudioFile(index)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editRecord ? 'Update Record' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Record Dialog - Glass Morphism Design */}
      {viewRecord && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewRecord(null)}
        >
          <div 
            className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Glass Morphism Style */}
            <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                <div className="relative flex-shrink-0">
                  {(() => {
                    const patient = patients.find(p => String(p.id) === String(viewRecord.patientId));
                    
                    // Construct proper photo URL
                    let imageUrl = '';
                    
                    if (patient?.photo) {
                      // If photo starts with http, use as-is, otherwise build the URL based on AddPatient storage format
                      if (patient.photo.startsWith('http')) {
                        imageUrl = patient.photo;
                      } else {
                        // Photos are stored in: server/Photos/patient Admission/{patientId}/
                        // Database stores: Photos/patient Admission/{patientId}/{filename}
                        // Static serving at: /Photos/patient%20Admission/{patientId}/{filename}
                        if (patient.photo.includes('Photos/patient Admission/')) {
                          // Photo path is already in correct format from database
                          imageUrl = `/${patient.photo.replace(/\s/g, '%20')}`;
                        } else {
                          // Assume it's just filename and build full path
                          imageUrl = `/Photos/patient%20Admission/${viewRecord.patientId}/${patient.photo}`;
                        }
                      }
                    } else if (patient?.photoUrl) {
                      if (patient.photoUrl.startsWith('http')) {
                        imageUrl = patient.photoUrl;
                      } else if (patient.photoUrl.includes('Photos/patient Admission/')) {
                        imageUrl = `/${patient.photoUrl.replace(/\s/g, '%20')}`;
                      } else {
                        imageUrl = `/Photos/patient%20Admission/${viewRecord.patientId}/${patient.photoUrl}`;
                      }
                    }

                    return (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={`${viewRecord.patientName}'s photo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('❌ Image failed for:', viewRecord.patientName);
                                console.log('   Failed URL:', imageUrl);
                                
                                // Show fallback avatar
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement as HTMLElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-lg font-semibold text-white">${(viewRecord.patientName || 'P').charAt(0).toUpperCase()}</span>`;
                                }
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully for patient:', viewRecord.patientName, 'URL:', imageUrl);
                              }}
                            />
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-white">
                            {(viewRecord.patientName || 'P').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="absolute -bottom-1 -right-1">
                    <div className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs px-2 py-1 rounded-full">
                      Active
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{viewRecord.patientName}</span>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                    <span className="text-gray-600">Call Records Total:</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                      {viewedPatientCallRecords.length} Records
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewRecord(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Modal Body - Glass Morphism Style */}
            <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
              <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                
                {/* Patient Information Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
                    </div>
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Patient Name</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{viewRecord.patientName}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-bold text-xs sm:text-sm">ID</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Patient ID</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{formatPatientId(viewRecord.patientId)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Joining Date</div>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                            {(() => {
                              const patient = patients.find(p => String(p.id) === String(viewRecord.patientId));
                              return patient && patient.admissionDate 
                                ? format(new Date(patient.admissionDate), 'dd/MM/yyyy') 
                                : 'Not Available';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Add New Call Record Form Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    Add New Call Record
                  </h3>

                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Call Date */}
                      <div className="space-y-2">
                        <Label htmlFor="add-call-date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Call Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="add-call-date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full bg-white/90 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-300"
                          required
                        />
                      </div>

                      {/* Patient Selection - Read Only */}
                      <div className="space-y-2">
                        <Label htmlFor="add-call-patient" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-600" />
                          Patient <span className="text-green-500">*</span>
                        </Label>
                        <Input
                          id="add-call-patient"
                          type="text"
                          value={`${viewRecord.patientName} (${formatPatientId(viewRecord.patientId)})`}
                          readOnly
                          className="w-full bg-gray-50/90 backdrop-blur-sm border-indigo-200 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Call Description */}
                    <div className="space-y-2">
                      <Label htmlFor="add-call-description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Call Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="add-call-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-white/90 backdrop-blur-sm border border-orange-200 focus:border-orange-400 focus:ring-orange-300 min-h-[100px] resize-y"
                        placeholder="Enter detailed description of the call..."
                        required
                      />
                    </div>

                    {/* Audio Upload Section */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mic className="h-4 w-4 text-red-600" />
                        Upload Audio Files <span className="text-gray-500">(Optional)</span>
                      </Label>
                      
                      <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-red-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                        {/* File Upload Input */}
                        <Input
                          type="file"
                          accept="audio/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const maxSize = 999 * 1024 * 1024; // 999MB in bytes
                            
                            // Check file sizes
                            const validFiles = files.filter(file => {
                              if (file.size > maxSize) {
                                toast({
                                  title: "File Too Large",
                                  description: `${file.name} is larger than 999MB. Please select a smaller file.`,
                                  variant: "destructive",
                                });
                                return false;
                              }
                              return true;
                            });
                            
                            if (validFiles.length > 0) {
                              setFormData(prev => ({
                                ...prev,
                                audioFiles: [...prev.audioFiles, ...validFiles]
                              }));
                            }
                          }}
                          className="mb-3 bg-white/80 border-red-200 focus:border-red-400 focus:ring-red-300"
                        />
                        
                        <p className="text-xs text-gray-500 mb-3">
                          Select audio files (MP3, WAV, M4A, etc.) - Maximum 999MB per file
                        </p>

                        {/* Uploaded Audio Files */}
                        {formData.audioFiles.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-red-700">Uploaded Audio Files ({formData.audioFiles.length}):</Label>
                            {formData.audioFiles.map((audioFile, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded border">
                                <div className="flex items-center space-x-3">
                                  <Mic className="w-4 h-4 text-red-600" />
                                  <div>
                                    <span className="text-sm font-medium">{audioFile.name}</span>
                                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded inline-block ml-2">
                                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </div>
                                  </div>
                                  <audio controls className="h-8">
                                    <source src={URL.createObjectURL(audioFile)} type={audioFile.type} />
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAudioFile(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-700">
                            <strong>Supported formats:</strong> MP3, WAV, M4A, AAC, OGG, FLAC
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            <strong>File size limit:</strong> 999MB per file
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button for Call Record Form */}
                    <div className="flex justify-end pt-6 pb-2 border-t border-gray-200 mt-6">
                      <Button
                        type="submit"
                        disabled={isLoadingRecords || !formData.date || !formData.description.trim()}
                        className="px-8 py-3 text-base font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        {isLoadingRecords ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding Call Record...
                          </>
                        ) : (
                          <>
                            <Phone className="w-5 h-5 mr-2" />
                            Add Call Record
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Call History Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                      Call History ({viewedPatientCallRecords.length})
                    </h3>
                    
                    {/* Month/Year Selector */}
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 min-w-[140px]"
                      onClick={() => setShowViewDialogMonthYearDialog(true)}
                    >
                      {viewDialogFilterMonth !== null && viewDialogFilterYear !== null 
                        ? `${months[(viewDialogFilterMonth) - 1]} ${viewDialogFilterYear}`
                        : `${months[(viewDialogSelectedMonth) - 1]} ${viewDialogSelectedYear}`
                      }
                    </button>
                  </div>
                  
                  {viewedPatientCallRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        No call records found for this patient
                      </p>
                      <p className="text-sm text-slate-400 mt-1">Call records will appear here when added</p>
                    </div>
                  ) : (
                    <>
                      {/* Table Format */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white">
                              <th className="px-4 py-3 text-left text-sm font-semibold">S No</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Audio</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {viewedPatientCallRecords.map((record, index) => (
                              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {format(new Date(record.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                  <div className="truncate" title={record.description || 'No description'}>
                                    {record.description || 'No description'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {record.audioRecording?.url ? (
                                    <div className="flex justify-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const audioUrl = record.audioRecording?.url;
                                          console.log('🎵 Play button clicked, URL:', audioUrl);
                                          if (audioUrl) {
                                            playAudio(audioUrl, record.id);
                                          } else {
                                            console.error('❌ No audio URL available');
                                            toast({
                                              title: "Audio Error",
                                              description: "No audio file available for this record.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        title="Play Audio"
                                        className="p-1 h-8 w-8"
                                      >
                                        {playingAudio === record.id ? (
                                          <Pause className="w-3 h-3 text-blue-600" />
                                        ) : (
                                          <Play className="w-3 h-3 text-blue-600" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          // Cycle through speed options: 0.5x, 1x, 1.25x, 1.5x, 2x
                                          const speeds = [0.5, 1, 1.25, 1.5, 2];
                                          const currentIndex = speeds.indexOf(playbackSpeed);
                                          const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                                          setPlaybackSpeed(nextSpeed);
                                          // Update current audio if playing
                                          if (audioRef.current && playingAudio === record.id) {
                                            audioRef.current.playbackRate = nextSpeed;
                                          }
                                        }}
                                        title={`Playback Speed: ${playbackSpeed}x`}
                                        className="p-1 h-8 w-8"
                                      >
                                        <span className="text-xs font-mono text-purple-600">{playbackSpeed}x</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const audioUrl = record.audioRecording?.url;
                                          console.log('📥 Download button clicked, URL:', audioUrl);
                                          if (audioUrl) {
                                            downloadAudio(audioUrl, `${record.patientName}-audio-${record.date}`);
                                          } else {
                                            console.error('❌ No audio URL available for download');
                                            toast({
                                              title: "Download Error",
                                              description: "No audio file available for download.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        title="Download Audio"
                                        className="p-1 h-8 w-8"
                                      >
                                        <Download className="w-3 h-3 text-green-600" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">No Audio</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleDeleteFromViewPopup(record)}
                                    className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0 inline-flex items-center justify-center"
                                    title="Delete call record"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month/Year Filter Dialog for View */}
      <Dialog open={showViewDialogMonthYearDialog} onOpenChange={setShowViewDialogMonthYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Call History</DialogTitle>
            <DialogDescription>
              Select month and year to filter call records
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <select
                value={viewDialogSelectedMonth}
                onChange={(e) => setViewDialogSelectedMonth(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <select
                value={viewDialogSelectedYear}
                onChange={(e) => setViewDialogSelectedYear(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setViewDialogFilterMonth(null);
              setViewDialogFilterYear(null);
              setShowViewDialogMonthYearDialog(false);
            }}>
              Clear Filter
            </Button>
            <Button onClick={() => {
              setViewDialogFilterMonth(viewDialogSelectedMonth);
              setViewDialogFilterYear(viewDialogSelectedYear);
              setShowViewDialogMonthYearDialog(false);
            }}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Month/Year Filter Dialog */}
      <MonthYearPickerDialog
        open={showMonthYearDialog}
        onOpenChange={setShowMonthYearDialog}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onApply={() => {
          setFilterMonth(selectedMonth);
          setFilterYear(selectedYear);
          setShowMonthYearDialog(false);
        }}
        title="Filter Records"
        description="Select month and year to filter call records"
        previewText="records"
      />

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
                  Delete Call Record
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this call record? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {deleteRecord && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{deleteRecord.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Contact className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Patient ID: {deleteRecord.patientId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{format(new Date(deleteRecord.date), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteRecord.description}</span>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">⚠️ This will permanently delete:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Call record details and description</li>
                    <li>• Associated audio recordings</li>
                    <li>• All related metadata</li>
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
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      </div>
    </div>
  );
};

export default PatientCallRecord;
