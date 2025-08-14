import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatabaseService } from '../../services/databaseService';
import CallRecordService from '../../services/callRecordService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { FileText, Search, Download, Edit2, Loader2, Play, Pause, RefreshCw, Trash2, Eye, Pencil, Mic, Square, File as FileIcon, User } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Textarea } from '../../components/ui/textarea';
import { uploadMedicalHistoryFile } from '../../services/simpleFileUpload';

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);

  // Month and year state for view dialog filtering
  const [viewDialogSelectedMonth, setViewDialogSelectedMonth] = useState(new Date().getMonth());
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
        return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
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
        return recordDate.getMonth() === viewDialogFilterMonth && recordDate.getFullYear() === viewDialogFilterYear;
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
          // If we have a full path, construct the URL properly
          // Remove any leading slash and ensure it works with the backend static serving
          const cleanPath = record.audio_file_path.startsWith('/') ? record.audio_file_path.substring(1) : record.audio_file_path;
          audioUrl = `http://localhost:4000/${cleanPath}`;
        } else if (record.audio_file_name) {
          // Fallback: construct URL from filename
          audioUrl = `http://localhost:4000/uploads/audio/${record.audio_file_name}`;
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
    if (confirm('Are you sure you want to delete this call record?')) {
      await handleDelete(record);
      // Refresh the viewed patient records
      setRefreshCounter(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    console.log('Add Record button clicked',);
console.log('Form Data:', formData);
    console.log('Selected Patient ID:', selectedPatientId);
    console.log('Audio Recording:', audioRecording);
    if (!formData.patientId || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Patient and Date).",
        variant: "destructive",
      });
      return;
    }

    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

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
          audioFilePath = await uploadMedicalHistoryFile(audioFile, formData.patientId, 'audio');
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
          audioFilePath = await uploadMedicalHistoryFile(firstAudioFile, formData.patientId, 'audio');
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

      // Send JSON data directly (not FormData)
      if (isEditing) {
        await CallRecordService.updatePatientCallRecord(recordId, dbRecord);
        toast({
          title: "Record Updated",
          description: "Call record has been successfully updated.",
        });
      } else {
        await CallRecordService.addPatientCallRecord(dbRecord);
        toast({
          title: "Record Added",
          description: "Call record has been successfully added.",
        });
      }

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-blue-700 hover:scale-110">
                <FileText className="w-6 h-6 text-white transition-transform duration-300 hover:rotate-3" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-blue-600">Patients Call Record</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage patient call records and audio recordings
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={async () => {
                  setIsUpdatingRecords(true);
                  await Promise.all([loadPatients(), loadCallRecords()]);
                  setIsUpdatingRecords(false);
                  setRefreshCounter(prev => prev + 1);
                }}
                disabled={isUpdatingRecords}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                {isUpdatingRecords ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="font-medium">Refresh</span>
              </Button>
              
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Add Record</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{filteredRecords?.length || 0}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Active Patients</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                    {new Set(filteredRecords?.filter(record => !record.id.startsWith('patient_')).map(record => record.patientId)).size || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <Mic className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Audio Files</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                    {(() => {
                      const totalAudioCount = filteredRecords?.reduce((total, record) => {
                        const patientAudioCount = callRecords.filter(callRecord => {
                          return callRecord.patientId === record.patientId && callRecord.audioRecording;
                        }).length;
                        return total + patientAudioCount;
                      }, 0) || 0;
                      return totalAudioCount;
                    })()}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, ID, contact, UHID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleExportExcel()} 
              className="modern-btn modern-btn-outline flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button 
              onClick={() => handleExportPDF()} 
              className="modern-btn modern-btn-outline flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>

          <button
            type="button"
            className="modern-btn modern-btn-outline min-w-[140px] justify-center"
            onClick={() => setShowMonthYearDialog(true)}
          >
            {filterMonth !== null && filterYear !== null 
              ? `${months[filterMonth]} ${filterYear}`
              : `${months[selectedMonth]} ${selectedYear}`
            }
          </button>
        </div>
      </div>


      {/* Records Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Patients List</h2>
        </div>
        
        <div className="p-6">
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
                              <div className="flex justify-center items-center">
                                {patient?.photo || patient?.photoUrl ? (
                                  <img
                                    src={patient.photo || patient.photoUrl}
                                    alt={`${record.patientName}'s photo`}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                      // Fallback to default avatar if image fails to load
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPGF0aCBkPSJNMjAgMTJDMTcuNzkgMTIgMTYgMTMuNzkgMTYgMTZDMTYgMTguMjEgMTcuNzkgMjAgMjAgMjBDMjIuMjEgMjAgMjQgMTguMjEgMjQgMTZDMjQgMTMuNzkgMjIuMjEgMTIgMjAgMTJaTTIwIDI2QzE2LjY3IDI2IDEwIDI3LjY3IDEwIDMxVjMySDMwVjMxQzMwIDI3LjY3IDIzLjMzIDI2IDIwIDI2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 6C10.34 6 9 7.34 9 9C9 10.66 10.34 12 12 12C13.66 12 15 10.66 15 9C15 7.34 13.66 6 12 6ZM12 15C9.33 15 4 16.34 4 19V20H20V19C20 16.34 14.67 15 12 15Z" fill="#9CA3AF"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-black">{record.patientId}</span>
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
                                  className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 hover:border-green-300 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                                  title="View Patient Details"
                                >
                                  <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                </button>
                                <button
                                  onClick={() => {
                                    const isPatientRecord = record.id.toString().startsWith('patient_');
                                    if (isPatientRecord) {
                                      // For patient placeholder records, open dialog with pre-selected patient
                                      openAddDialogForPatient(record.patientId);
                                    } else {
                                      // For actual call records, edit the record
                                      handleEdit(record);
                                    }
                                  }}
                                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 hover:border-blue-300 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                                  title={record.id.toString().startsWith('patient_') ? 'Add Call Record' : 'Edit Call Record'}
                                >
                                  <Mic className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
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
                      const patient = patients.find(p => p.id === selectedPatientId);
                      return patient ? `${patient.name} (${patient.id})` : 'Unknown Patient';
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
                        <Trash2 className="w-4 h-4" />
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

      {/* View Record Dialog - PatientHistory Style */}
      {viewRecord && (
        <Dialog key={`view-dialog-${viewRecord.patientId}-${refreshCounter}-${records.length}`} open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-primary">Patient Call Record</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Patient Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary">Patient Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="font-semibold text-muted-foreground">Patient Name:</Label>
                    <p className="text-foreground font-medium">{viewRecord.patientName}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Patient ID:</Label>
                    <p className="text-foreground font-medium">{viewRecord.patientId}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Joining Date:</Label>
                    <p className="text-foreground font-medium">
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

              {/* Month & Year Filter for Call History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Call History</h3>
                  <button
                    type="button"
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary flex items-center gap-1 min-w-[140px] text-sm"
                    onClick={() => setShowViewDialogMonthYearDialog(true)}
                  >
                    {viewDialogFilterMonth !== null && viewDialogFilterYear !== null 
                      ? `${months[viewDialogFilterMonth]} ${viewDialogFilterYear}`
                      : `${months[viewDialogSelectedMonth]} ${viewDialogSelectedYear}`
                    }
                  </button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="text-center font-semibold">S NO</TableHead>
                        <TableHead className="text-center font-semibold">Date</TableHead>
                        <TableHead className="text-center font-semibold">Description</TableHead>
                        <TableHead className="text-center font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Get all call records for this patient */}
                      {viewedPatientCallRecords.map((record, index) => (
                          <TableRow key={record.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="text-center">{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-center max-w-xs truncate" title={record.description}>
                              {record.description || 'No description'}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                {/* Audio Controls */}
                                {record.audioRecording?.url && (
                                  <div className="flex space-x-1">
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
                                    >
                                      {playingAudio === record.id ? (
                                        <Pause className="w-4 h-4 text-blue-600" />
                                      ) : (
                                        <Play className="w-4 h-4 text-blue-600" />
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
                                    >
                                      <Download className="w-4 h-4 text-green-600" />
                                    </Button>
                                  </div>
                                )}
                                
                                {/* Delete Control */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteFromViewPopup(record)}
                                  title="Delete Call Record"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      
                      {/* Show message if no call records exist */}
                      {viewedPatientCallRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center space-y-2">
                              <FileText className="w-8 h-8 text-muted-foreground/50" />
                              <p>No call records found for this patient</p>
                              <p className="text-sm">Call records will appear here when added</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Month/Year Filter Dialog for Main Table */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Records</DialogTitle>
            <DialogDescription>
              Select month and year to filter records
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
              setFilterMonth(null);
              setFilterYear(null);
              setShowMonthYearDialog(false);
            }}>
              Clear Filter
            </Button>
            <Button onClick={() => {
              setFilterMonth(selectedMonth);
              setFilterYear(selectedYear);
              setShowMonthYearDialog(false);
            }}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default PatientCallRecord;
