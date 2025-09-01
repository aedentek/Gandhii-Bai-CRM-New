import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatabaseService } from '../../services/databaseService';
import MedicalRecordService from '../../services/medicalRecordService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { Camera, Mic, Image, Play, Pause, Download, Edit2, Loader2, RefreshCw, RefreshCcw, Trash2, Eye, Square, Upload, FileText, Users, Activity, UserCheck, CalendarDays, Search, X, ChevronLeft, ChevronRight, ExternalLink, File, TrendingUp, Clock, Plus, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Textarea } from '../../components/ui/textarea';
import { uploadMedicalHistoryFile, uploadPatientHistoryFile } from '../../services/simpleFileUpload';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import { PatientPhoto } from '../../utils/photoUtils';
import usePageTitle from '@/hooks/usePageTitle';

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

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  recordType: string;
  description: string;
  images: string[];
  audioRecording?: {
    blob: Blob | null;
    url: string;
    duration: number;
  };
  audioFiles: File[];
  photoFiles: File[];
  createdAt: string;
  createdBy: string;
}

const PatientMedicalRecord: React.FC = () => {
  // Set page title
  usePageTitle();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isUpdatingRecords, setIsUpdatingRecords] = useState(false);
  
  // Loading states
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Month and year state for filtering
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based for August = 8
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isMonthYearDialogOpen, setIsMonthYearDialogOpen] = useState(false); // Match Test Report Amount naming
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth); // Also 1-based for consistency
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  // View dialog filtering
  const [viewDialogSelectedMonth, setViewDialogSelectedMonth] = useState(currentMonth); // 1-based
  const [viewDialogSelectedYear, setViewDialogSelectedYear] = useState(currentYear);
  const [showViewDialogMonthYearDialog, setShowViewDialogMonthYearDialog] = useState(false);
  const [viewDialogFilterMonth, setViewDialogFilterMonth] = useState<number | null>(null);
  const [viewDialogFilterYear, setViewDialogFilterYear] = useState<number | null>(null);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<MedicalRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewImageModal, setViewImageModal] = useState<{
    show: boolean;
    images: string[];
    currentIndex: number;
    recordId: string;
  }>({
    show: false,
    images: [],
    currentIndex: 0,
    recordId: ''
  });

  // Media recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioRecording, setAudioRecording] = useState<{blob: Blob, url: string, duration: number} | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    recordType: 'consultation',
    description: '',
    date: new Date().toISOString().split('T')[0],
    audioFiles: [] as File[],
    photoFiles: [] as File[],
    documentFiles: [] as File[]
  });

  // New record form states
  const [newRecord, setNewRecord] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    recordType: '',
    description: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Function to format patient ID as P0001
  const formatPatientId = (id: string | number): string => {
    // Convert to number, removing any existing P prefix and leading zeros
    const numericId = typeof id === 'string' ? parseInt(id.replace(/^P0*/, '')) : id;
    return `P${numericId.toString().padStart(4, '0')}`;
  };

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterYear]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageModalCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          // Create File object using proper typing
          const file = new (window as any).File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedPhotos(prev => [...prev, file]);
          setFormData(prev => ({ ...prev, photoFiles: [...prev.photoFiles, file] }));
          
          const previewUrl = URL.createObjectURL(blob);
          setPreviewPhoto(previewUrl);
          
          toast({
            title: "Photo Captured",
            description: "Photo captured successfully!",
          });
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  };

  // Audio recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioRecording({ blob, url, duration: recordingTime });
        
        // Create File object using proper typing
        const audioFile = new (window as any).File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        setFormData(prev => ({ ...prev, audioFiles: [audioFile] }));
        
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
        description: "Could not start recording. Please check microphone permissions.",
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
        recordingIntervalRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: `Audio recorded for ${recordingTime} seconds.`,
      });
    }
  };

  // File upload handlers
  const handlePhotoFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      
      const invalidFiles = newFiles.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: `Files larger than 50MB are not allowed.`,
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        photoFiles: [...prev.photoFiles, ...newFiles]
      }));
    }
  };

  const handleAudioFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const maxSize = 500 * 1024 * 1024; // 500MB limit
      
      const invalidFiles = newFiles.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: `Files larger than 500MB are not allowed.`,
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

  // Document file upload handler
  const handleDocumentFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        // Allow common document formats
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid File Type",
            description: `${file.name}: Only PDF, Word, Excel, PowerPoint, text, and image files are allowed.`,
            variant: "destructive",
          });
          return false;
        }
        
        if (file.size > 500 * 1024 * 1024) { // 500MB limit
          toast({
            title: "File Too Large",
            description: `${file.name}: Files larger than 500MB are not allowed.`,
            variant: "destructive",
          });
          return false;
        }
        
        return true;
      });

      setFormData(prev => ({
        ...prev,
        documentFiles: [...prev.documentFiles, ...newFiles]
      }));
    }
  };

  // Audio playback
  const playAudio = (audioUrl: string, recordId: string) => {
    if (playingAudio === recordId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
        setPlayingAudio(recordId);
        
        audioRef.current.onended = () => {
          setPlayingAudio(null);
        };
      }
    }
  };

  const downloadAudio = (audioUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${filename}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Data loading functions
  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true);
      console.log('Loading patients from DatabaseService...');
      const data = await DatabaseService.getAllPatients();
      console.log('Patients loaded:', data.length);
      
      const formattedPatients = data.map((p: any) => ({
        ...p,
        id: p.id.toString()
      }));
      
      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      setIsLoadingRecords(true);
      console.log('Loading medical records from MedicalRecordService...');
      
      const medicalRecordsData = await MedicalRecordService.getAllPatientMedicalRecords();
      console.log('Medical records loaded:', medicalRecordsData.length);
      
      const processedRecords = medicalRecordsData.map((record: any) => ({
        ...record,
        patientId: record.patient_id?.toString() || record.patientId?.toString() || '',
        patientName: record.patient_name || record.patientName || 'Unknown',
        recordType: record.record_type || record.recordType || 'consultation',
        images: Array.isArray(record.images) ? record.images : (record.images ? JSON.parse(record.images) : []),
        createdBy: record.created_by || record.createdBy || 'System',
        createdAt: record.created_at || record.createdAt || new Date().toISOString()
      }));
      
      setMedicalRecords(processedRecords);
    } catch (error) {
      console.error('Error loading medical records:', error);
      toast({
        title: "Error",
        description: "Failed to load medical records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Load data without resetting filters (for month/year changes)
  const loadData = async () => {
    setRefreshCounter(prev => prev + 1);
    setIsLoadingRecords(true);
    
    try {
      // Load patients and medical records separately without resetting filters
      const [patientsData, medicalRecordsData] = await Promise.all([
        DatabaseService.getAllPatients(),
        MedicalRecordService.getAllPatientMedicalRecords()
      ]);

      // Process patients
      const formattedPatients = patientsData.map((p: any) => {
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
        
        return {
          id: p.id.toString(),
          name: p.name,
          age: p.age || '',
          gender: p.gender || '',
          contactNumber: p.contactNumber || p.phone || '',
          address: p.address || '',
          locality: p.locality || '',
          city: p.city || '',
          bloodGroup: p.bloodGroup || '',
          occupation: p.occupation || '',
          guardian: p.guardian || '',
          guardianPhone: p.guardianPhone || '',
          referredBy: p.referredBy || '',
          uhid: p.uhid || '',
          photo: p.photo || '',
          photoUrl: p.photoUrl || '',
          status: p.status || 'Active',
          admissionDate: getAdmissionDate(p)
        };
      });

      // Process medical records
      const processedMedicalRecords = medicalRecordsData.map((record: any) => ({
        ...record,
        patientId: record.patient_id?.toString() || record.patientId?.toString() || '',
        patientName: record.patient_name || record.patientName || 'Unknown',
        recordType: record.record_type || record.recordType || 'consultation',
        images: Array.isArray(record.images) ? record.images : (record.images ? JSON.parse(record.images) : []),
        createdBy: record.created_by || record.createdBy || 'System',
        createdAt: record.created_at || record.createdAt || new Date().toISOString()
      }));

      // Create patient list records exactly like refreshData
      const patientListRecords: MedicalRecord[] = [];
      
      // For ALL patients, create basic patient registration entries for main table display
      formattedPatients.forEach(patient => {
        // Find the latest medical record for this patient (if any)
        const latestMedicalRecord = processedMedicalRecords
          .filter(record => String(record.patientId) === String(patient.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        // Create patient registration entry for main table
        patientListRecords.push({
          id: `patient_${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          date: new Date().toISOString().split('T')[0],
          recordType: 'registration',
          description: latestMedicalRecord ? latestMedicalRecord.description : `Patient ${patient.name} registered in the system.`,
          images: latestMedicalRecord?.images || [],
          audioRecording: latestMedicalRecord?.audioRecording,
          audioFiles: latestMedicalRecord?.audioFiles || [],
          photoFiles: latestMedicalRecord?.photoFiles || [],
          createdAt: new Date().toISOString(),
          createdBy: 'System'
        });
      });

      // Sort by Patient ID in ascending order (P0001, P0002, P0003, etc.)
      patientListRecords.sort((a, b) => {
        // Extract numeric part from patient ID for proper sorting
        const getNumericId = (patientId: string) => {
          const numericPart = patientId.replace(/^P0*/, ''); // Remove P prefix and leading zeros
          return parseInt(numericPart) || 0;
        };
        
        const aId = getNumericId(a.patientId);
        const bId = getNumericId(b.patientId);
        
        return aId - bId; // Ascending order
      });

      setPatients(formattedPatients);
      setMedicalRecords(processedMedicalRecords);
      setRecords(patientListRecords);
      
      console.log('Data loaded successfully without resetting filters');
    } catch (error) {
      console.error('Error loading data:', error);
      setPatients([]);
      setMedicalRecords([]);
      setRecords([]);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecords(false);
      setIsLoadingComplete(true);
    }
  };

  const refreshData = async () => {
    setRefreshCounter(prev => prev + 1);
    setIsLoadingRecords(true);
    
    // Reset all filters to current month/year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Convert to 1-based: August = 8
    const currentYear = currentDate.getFullYear();
    
    setFilterMonth(currentMonth);
    setFilterYear(currentYear);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    
    try {
      // First load patients and medical records separately 
      const [patientsData, medicalRecordsData] = await Promise.all([
        DatabaseService.getAllPatients(),
        MedicalRecordService.getAllPatientMedicalRecords()
      ]);

      // Process patients
      const formattedPatients = patientsData.map((p: any) => {
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
        
        return {
          id: p.id.toString(),
          name: p.name,
          age: p.age || '',
          gender: p.gender || '',
          contactNumber: p.contactNumber || p.phone || '',
          address: p.address || '',
          locality: p.locality || '',
          city: p.city || '',
          bloodGroup: p.bloodGroup || '',
          occupation: p.occupation || '',
          guardian: p.guardian || '',
          guardianPhone: p.guardianPhone || '',
          referredBy: p.referredBy || '',
          uhid: p.uhid || '',
          photo: p.photo || '',
          photoUrl: p.photoUrl || '',
          status: p.status || 'Active',
          admissionDate: getAdmissionDate(p)
        };
      });

      // Process medical records
      const processedMedicalRecords = medicalRecordsData.map((record: any) => {
        console.log('🔍 Processing medical record:', record.id, 'Raw images:', record.images, 'Type:', typeof record.images);
        
        let parsedImages = [];
        try {
          if (Array.isArray(record.images)) {
            parsedImages = record.images;
          } else if (record.images && typeof record.images === 'string') {
            parsedImages = JSON.parse(record.images);
          } else if (record.images) {
            parsedImages = record.images;
          }
        } catch (error) {
          console.error('❌ Error parsing images for record', record.id, ':', error);
          parsedImages = [];
        }
        
        console.log('✅ Parsed images for record', record.id, ':', parsedImages);
        
        return {
          ...record,
          patientId: record.patient_id?.toString() || record.patientId?.toString() || '',
          patientName: record.patient_name || record.patientName || 'Unknown',
          recordType: record.record_type || record.recordType || 'consultation',
          images: parsedImages,
          createdBy: record.created_by || record.createdBy || 'System',
          createdAt: record.created_at || record.createdAt || new Date().toISOString()
        };
      });

      // Create patient list records exactly like PatientCallRecord
      const patientListRecords: MedicalRecord[] = [];
      
      // For ALL patients, create basic patient registration entries for main table display
      formattedPatients.forEach(patient => {
        // Find the latest medical record for this patient (if any)
        const latestMedicalRecord = processedMedicalRecords
          .filter(record => String(record.patientId) === String(patient.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        // Create patient registration entry for main table
        patientListRecords.push({
          id: `patient_${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          date: new Date().toISOString().split('T')[0],
          recordType: 'registration',
          description: latestMedicalRecord ? latestMedicalRecord.description : `Patient ${patient.name} registered in the system.`,
          images: latestMedicalRecord?.images || [],
          audioRecording: latestMedicalRecord?.audioRecording,
          audioFiles: latestMedicalRecord?.audioFiles || [],
          photoFiles: latestMedicalRecord?.photoFiles || [],
          createdAt: new Date().toISOString(),
          createdBy: 'System'
        });
      });

      // Sort by Patient ID in ascending order (P0001, P0002, P0003, etc.)
      patientListRecords.sort((a, b) => {
        // Extract numeric part from patient ID for proper sorting
        const getNumericId = (patientId: string) => {
          const numericPart = patientId.replace(/^P0*/, ''); // Remove P prefix and leading zeros
          return parseInt(numericPart) || 0;
        };
        
        const aId = getNumericId(a.patientId);
        const bId = getNumericId(b.patientId);
        
        return aId - bId; // Ascending order
      });

      setPatients(formattedPatients);
      setMedicalRecords(processedMedicalRecords);
      setRecords(patientListRecords);
      
      console.log('Patient list with medical records loaded successfully:', patientListRecords.length);
      console.log('Actual medical records loaded:', processedMedicalRecords.length);
      console.log('Medical records sample:', processedMedicalRecords.slice(0, 2));
      console.log('Patients sample:', formattedPatients.slice(0, 2));
    } catch (error) {
      console.error('Error loading data:', error);
      setPatients([]);
      setMedicalRecords([]);
      setRecords([]);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecords(false);
      setIsLoadingComplete(true);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle keyboard events for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewImageModal.show && e.key === 'Escape') {
        console.log('🔴 Global Escape key pressed - closing image modal');
        setViewImageModal({ show: false, images: [], currentIndex: 0, recordId: '' });
      }
    };

    if (viewImageModal.show) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the close button when modal opens
      setTimeout(() => {
        if (imageModalCloseButtonRef.current) {
          imageModalCloseButtonRef.current.focus();
          console.log('🔵 Image modal close button focused');
        }
      }, 100);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [viewImageModal.show]);

  // Filtered and paginated data  
  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const patient = patients.find(p => String(p.id) === String(record.patientId));
        return record.patientName.toLowerCase().includes(searchLower) ||
               record.description.toLowerCase().includes(searchLower) ||
               record.patientId.toLowerCase().includes(searchLower) ||
               record.recordType.toLowerCase().includes(searchLower) ||
               (patient?.contactNumber && patient.contactNumber.toLowerCase().includes(searchLower)) ||
               (patient?.uhid && patient.uhid.toLowerCase().includes(searchLower));
      });
    }

    // Type filtering
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.recordType === typeFilter);
    }

    // Status filtering (filter by patient status)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => {
        const patient = patients.find(p => String(p.id) === String(record.patientId));
        return patient?.status === statusFilter;
      });
    }

    // Month & Year filtering (same as PatientCallRecord)
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === filterMonth - 1 && recordDate.getFullYear() === filterYear; // Convert 1-based filterMonth to 0-based for comparison
      });
    }

    // Sort by Patient ID in ascending order (P0001, P0002, P0003, etc.)
    filtered.sort((a, b) => {
      // Extract numeric part from patient ID for proper sorting
      const getNumericId = (patientId: string) => {
        const numericPart = patientId.replace(/^P0*/, ''); // Remove P prefix and leading zeros
        return parseInt(numericPart) || 0;
      };
      
      const aId = getNumericId(a.patientId);
      const bId = getNumericId(b.patientId);
      
      return aId - bId; // Ascending order
    });

    return filtered;
  }, [records, patients, searchTerm, typeFilter, statusFilter, filterMonth, filterYear]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // View record filtering
  const viewedPatientMedicalRecords = useMemo(() => {
    if (!viewRecord) return [];
    
    console.log('View Record:', viewRecord);
    console.log('All Medical Records:', medicalRecords);
    
    let filtered = medicalRecords.filter(record => {
      // Handle both 'P0051' format and '51' format for patient ID matching
      const viewPatientId = String(viewRecord.patientId).replace(/^P0*/, ''); // Remove P prefix and leading zeros
      const recordPatientId = String(record.patientId).replace(/^P0*/, ''); // Remove P prefix and leading zeros
      console.log(`Comparing viewPatientId: ${viewPatientId} with recordPatientId: ${recordPatientId}`);
      return viewPatientId === recordPatientId;
    });
    
    console.log('Filtered Medical Records for view:', filtered);
    
    if (viewDialogFilterMonth !== null && viewDialogFilterYear !== null) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === viewDialogFilterMonth - 1 && recordDate.getFullYear() === viewDialogFilterYear; // Convert 1-based viewDialogFilterMonth to 0-based for comparison
      });
    }
    
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [medicalRecords, viewRecord?.patientId, refreshCounter, viewDialogFilterMonth, viewDialogFilterYear]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      patientId: selectedPatientId || '',
      recordType: 'consultation',
      description: '',
      date: new Date().toISOString().split('T')[0],
      audioFiles: [],
      photoFiles: [],
      documentFiles: []
    });
    setAudioRecording(null);
    setCapturedPhotos([]);
    setPreviewPhoto(null);
    stopCamera();
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingRecords(true);
      
      // Find patient name
      const patient = patients.find(p => p.id === formData.patientId);
      const patientName = patient?.name || 'Unknown Patient';
      
      // Upload files
      const uploadedImages: string[] = [];
      
      // Upload photos
      for (const photoFile of formData.photoFiles) {
        try {
          const filePath = await uploadMedicalHistoryFile(photoFile, formData.patientId, 'document');
          uploadedImages.push(filePath);
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      }
      
      // Upload audio files
      for (const audioFile of formData.audioFiles) {
        try {
          const filePath = await uploadMedicalHistoryFile(audioFile, formData.patientId, 'audio');
          uploadedImages.push(filePath);
        } catch (error) {
          console.error('Error uploading audio:', error);
        }
      }

      // Upload document files
      for (const documentFile of formData.documentFiles) {
        try {
          const filePath = await uploadPatientHistoryFile(documentFile, formData.patientId, 'document');
          uploadedImages.push(filePath);
        } catch (error) {
          console.error('Error uploading document:', error);
        }
      }

      const recordData = {
        id: editRecord?.id || `MR${Date.now()}`,
        patient_id: formData.patientId,
        patient_name: patientName,
        date: formData.date,
        record_type: formData.recordType,
        description: formData.description,
        images: uploadedImages,
        created_by: 'Admin'
      };

      if (editRecord) {
        await MedicalRecordService.updatePatientMedicalRecord(editRecord.id, recordData);
        toast({
          title: "Success",
          description: "Medical record updated successfully!",
        });
      } else {
        await MedicalRecordService.addPatientMedicalRecord(recordData);
        toast({
          title: "Success",
          description: "Medical record added successfully!",
        });
      }

      setShowAddDialog(false);
      setEditRecord(null);
      resetForm();
      await refreshData();
    } catch (error) {
      console.error('Error saving medical record:', error);
      toast({
        title: "Error",
        description: "Failed to save medical record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRecords(false);
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    console.log('🔧 Edit Record Debug:');
    console.log('   Record:', record);
    console.log('   Record PatientId:', record.patientId, typeof record.patientId);
    console.log('   Record PatientName:', record.patientName);
    console.log('   Available Patients:', patients.map(p => ({ id: p.id, name: p.name, idType: typeof p.id })));
    
    setEditRecord(record);
    setFormData({
      patientId: record.patientId,
      recordType: record.recordType,
      description: record.description,
      date: record.date,
      audioFiles: [],
      photoFiles: [],
      documentFiles: []
    });
    setShowAddDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;

    try {
      await MedicalRecordService.deletePatientMedicalRecord(deleteRecord.id);
      toast({
        title: "Success",
        description: "Medical record deleted successfully!",
      });
      setShowDeleteConfirm(false);
      setDeleteRecord(null);
      await refreshData();
    } catch (error) {
      console.error('Error deleting medical record:', error);
      toast({
        title: "Error",
        description: "Failed to delete medical record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleView = (record: MedicalRecord) => {
    setViewRecord(record);
    // Initialize new record form with patient ID
    setNewRecord({
      patientId: record.patientId,
      date: new Date().toISOString().split('T')[0],
      recordType: '',
      description: ''
    });
    setSelectedFiles([]);
  };

  // Handler for new record form submission
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Form validation debug:');
    console.log('   viewRecord?.patientId:', viewRecord?.patientId);
    console.log('   newRecord.date:', newRecord.date);
    console.log('   newRecord.recordType:', `"${newRecord.recordType}"`);
    console.log('   newRecord.recordType?.trim():', `"${newRecord.recordType?.trim()}"`);
    
    if (!viewRecord?.patientId || !newRecord.date || !newRecord.recordType?.trim()) {
      console.log('❌ Validation failed!');
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields (Date and Record Type).",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Step 1: Upload files first and collect file paths
      const uploadedFilePaths: string[] = [];
      
      for (const file of selectedFiles) {
        try {
          // Upload each file using the patient history file upload endpoint
          const filePath = await uploadMedicalHistoryFile(file, viewRecord.patientId, 'document');
          uploadedFilePaths.push(filePath);
          console.log('✅ File uploaded:', filePath);
        } catch (error) {
          console.error('❌ File upload failed:', error);
          // Continue with other files even if one fails
        }
      }

      // Step 2: Submit the record data with file paths using JSON endpoint
      const recordData = {
        patient_id: viewRecord.patientId,
        patient_name: viewRecord.patientName,
        date: newRecord.date,
        record_type: newRecord.recordType,
        description: newRecord.description,
        images: uploadedFilePaths,
        created_by: 'system'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/patient-medical-records/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Medical record added successfully!",
        });

        // Reset form
        setNewRecord({
          patientId: '',
          date: new Date().toISOString().split('T')[0],
          recordType: '',
          description: ''
        });
        setSelectedFiles([]);

        // Refresh records to show the new record
        loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add record');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add medical record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      
      const invalidFiles = newFiles.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: "Files larger than 50MB are not allowed.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      toast({
        title: "Files Selected",
        description: `${newFiles.length} file(s) selected successfully.`,
      });
    }
  };

  const openAddDialogForPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = patients.find(p => String(p.id) === String(patientId));
    if (patient) {
      setFormData({
        patientId: patientId,
        recordType: 'consultation',
        description: '',
        date: new Date().toISOString().split('T')[0],
        audioFiles: [],
        photoFiles: [],
        documentFiles: []
      });
      setShowAddDialog(true);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map((record, index) => ({
      'S No': index + 1,
      'Patient ID': record.patientId,
      'Patient Name': record.patientName,
      'Date': format(new Date(record.date), 'dd/MM/yyyy'),
      'Record Type': record.recordType,
      'Description': record.description,
      'Media Count': record.images?.length || 0,
      'Created By': record.createdBy
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medical Records');
    
    const monthYearFilter = filterMonth !== null && filterYear !== null 
      ? `_${months[filterMonth - 1]}_${filterYear}` 
      : '';
    
    XLSX.writeFile(wb, `Patient_Medical_Records${monthYearFilter}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `Medical records exported to Excel successfully!`,
    });
  };

  return (
    <div className="crm-page-bg">
      
      {/* Image Viewer Modal */}
      {viewImageModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            console.log('🔵 Backdrop click detected, target:', e.target, 'currentTarget:', e.currentTarget);
            if (e.target === e.currentTarget) {
              console.log('🔴 Backdrop clicked - closing image modal');
              setViewImageModal({ show: false, images: [], currentIndex: 0, recordId: '' });
            } else {
              console.log('🔵 Click was not on backdrop - ignoring');
            }
          }}
          onKeyDown={(e) => {
            // Close modal on Escape key
            if (e.key === 'Escape') {
              console.log('🔴 Escape key pressed on backdrop - closing image modal');
              setViewImageModal({ show: false, images: [], currentIndex: 0, recordId: '' });
            }
          }}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div 
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden"
            onClick={(e) => {
              console.log('🔵 Modal content clicked - stopping propagation');
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 id="image-modal-title" className="text-lg font-semibold">
                Medical Record Files ({viewImageModal.currentIndex + 1} of {viewImageModal.images.length})
              </h3>
              <button
                ref={imageModalCloseButtonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 Close button clicked - closing image modal');
                  setViewImageModal({ show: false, images: [], currentIndex: 0, recordId: '' });
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 Close button mouse down - preventing default');
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 Close button touch start - preventing default');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 Close button key pressed - closing image modal');
                    setViewImageModal({ show: false, images: [], currentIndex: 0, recordId: '' });
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-100"
                title="Close Modal"
                type="button"
                tabIndex={0}
                aria-label="Close modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col items-center">
              <div className="relative max-w-full max-h-[60vh] overflow-hidden rounded-lg">
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${viewImageModal.images[viewImageModal.currentIndex]}`}
                  alt={`Medical record file ${viewImageModal.currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('Image failed to load:', viewImageModal.images[viewImageModal.currentIndex]);
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              
              {viewImageModal.images.length > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setViewImageModal(prev => ({
                      ...prev,
                      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.images.length - 1
                    }))}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-600"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="px-4 py-2 bg-gray-100 rounded-full text-sm">
                    {viewImageModal.currentIndex + 1} / {viewImageModal.images.length}
                  </span>
                  
                  <button
                    onClick={() => setViewImageModal(prev => ({
                      ...prev,
                      currentIndex: prev.currentIndex < prev.images.length - 1 ? prev.currentIndex + 1 : 0
                    }))}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-600"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${viewImageModal.images[viewImageModal.currentIndex]}`;
                    link.download = viewImageModal.images[viewImageModal.currentIndex].split('/').pop() || 'file';
                    link.click();
                  }}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                
                <button
                  onClick={() => {
                    window.open(`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${viewImageModal.images[viewImageModal.currentIndex]}`, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="crm-header-container">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="crm-header-icon">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient Medical Records</h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
              <div className="flex gap-2">
                <ActionButtons.Refresh onClick={() => {
                  console.log('🔄 Manual refresh triggered - refreshing entire page');
                  window.location.reload();
                }} />
                
                <ActionButtons.MonthYear
                  text={`${months[selectedMonth - 1]} ${selectedYear}`}
                  onClick={() => setIsMonthYearDialogOpen(true)}
                />
              </div>
              

            </div>
          </div>
        </div>





        {/* Professional Stats Cards - 2-Card Grid using Patient Management Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Active Patients Card */}
          <Card className="crm-stat-card crm-stat-card-green">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 truncate">Active Patients</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">{patients.length}</p>
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

          {/* Medical Records Card */}
          <Card className="crm-stat-card crm-stat-card-blue">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1 truncate">Medical Records</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{medicalRecords.length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Total records</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-blue">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Section - Full Width */}
        <div className="crm-controls-container">
          <div className="flex flex-col gap-4">
            {/* Month & Year Filter Button for mobile */}
            <div className="block sm:hidden">
              <Button 
                type="button"
                onClick={() => setIsMonthYearDialogOpen(true)}
                variant="outline"
                className="crm-month-year-btn w-full"
              >
                <CalendarDays className="crm-month-year-btn-icon" />
                <span className="crm-month-year-btn-text">
                  {filterMonth !== null && filterYear !== null 
                    ? `${months[filterMonth - 1]} ${filterYear}`
                    : `${months[selectedMonth - 1]} ${selectedYear}`
                  }
                </span>
                <span className="crm-month-year-btn-text-mobile">
                  {filterMonth !== null && filterYear !== null 
                    ? `${months[filterMonth - 1].slice(0, 3)} ${filterYear}`
                    : `${months[selectedMonth - 1].slice(0, 3)} ${selectedYear}`
                  }
                </span>
              </Button>
            </div>

            {/* Full Width Search Bar */}
            <div className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, ID, type, or condition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
                />
              </div>
            </div>
          </div>
        </div>
        

        {/* Records Table */}
        <div className="crm-table-container">
          <div className="crm-table-header">
            <div className="crm-table-title">
              <FileText className="crm-table-title-icon" />
              <h2 className="crm-table-title-text">Medical Records</h2>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {/* Loading Indicator */}
            {(!isLoadingComplete && isLoadingRecords) && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div className="text-sm text-gray-600">
                    Loading medical records...
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
                      <p className="text-lg">No medical records found</p>
                      <p className="text-sm mt-2">
                        {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                          ? 'Try adjusting your filters or search term'
                          : 'Start by adding your first medical record'
                        }
                      </p>
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
                      <TableHead className="text-center">Records</TableHead>
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
                                <PatientPhoto 
                                  photoPath={patient?.photo} 
                                  alt={patient?.name || record.patientName}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mx-auto border bg-muted"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium text-blue-600">{formatPatientId(record.patientId)}</span>
                            </TableCell>
                            <TableCell className="text-center font-semibold">{record.patientName}</TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                // Count actual medical records for this patient
                                const patientRecordCount = medicalRecords.filter(medRecord => {
                                  const medPatientId = String(medRecord.patientId).replace(/^P0*/, '');
                                  const currentPatientId = String(record.patientId).replace(/^P0*/, '');
                                  return medPatientId === currentPatientId;
                                }).length;

                                return patientRecordCount > 0 ? (
                                  <div className="flex justify-center items-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full w-8 h-8 p-0"
                                      title={`${patientRecordCount} medical record${patientRecordCount > 1 ? 's' : ''} available`}
                                    >
                                      <span className="text-sm font-semibold">{patientRecordCount}</span>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleView(record)}
                                  className="action-btn-lead action-btn-view"
                                  title="View Patient Details"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const isPatientRecord = record.id.toString().startsWith('patient_');
                                    if (isPatientRecord) {
                                      // For patient placeholder records, open dialog with pre-selected patient
                                      openAddDialogForPatient(record.patientId);
                                    } else {
                                      // For actual medical records, edit the record
                                      handleEdit(record);
                                    }
                                  }}
                                  className="action-btn-lead action-btn-edit"
                                  title={record.id.toString().startsWith('patient_') ? 'Add Medical Record' : 'Edit Medical Record'}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button> */}
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl">
          {/* Modal Header - Beautiful Design */}
          <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-green-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-green-600 flex-shrink-0" />
                  <span className="truncate">{editRecord ? 'Edit Medical Record' : 'Add Medical Record'}</span>
                </h2>
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                  <span className="text-gray-600">
                    {editRecord ? 'Update the medical record details below.' : 'Add a new medical record with audio and photo uploads.'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditRecord(null);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Modal Body - Beautiful Design */}
          <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
            <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
            
            {/* Form Content - Beautiful Card Layout */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="patient" className="text-sm font-medium text-gray-700 mb-2 block">Patient *</Label>
                  <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {(() => {
                      if (!formData.patientId) {
                        return 'No patient selected';
                      }
                      
                      console.log('🔍 Patient Lookup Debug:');
                      console.log('   Looking for PatientId:', formData.patientId, typeof formData.patientId);
                      console.log('   Patients array length:', patients.length);
                      console.log('   First few patients:', patients.slice(0, 3).map(p => ({ id: p.id, name: p.name, idType: typeof p.id })));
                      
                      // Normalize the patient ID - remove P prefix and leading zeros for comparison
                      const normalizeId = (id: string | number) => {
                        return String(id).replace(/^P0*/, '');
                      };
                      
                      const targetId = normalizeId(formData.patientId);
                      console.log('   Normalized target ID:', targetId);
                      
                      // Try to find patient with normalized ID comparison
                      let selectedPatient = patients.find(p => {
                        const normalizedPatientId = normalizeId(p.id);
                        console.log('   Comparing:', normalizedPatientId, 'with', targetId);
                        return normalizedPatientId === targetId;
                      });
                      
                      if (!selectedPatient) {
                        // Try exact match as fallback
                        selectedPatient = patients.find(p => String(p.id) === String(formData.patientId));
                      }
                      
                      console.log('   Selected Patient:', selectedPatient);
                      
                      if (!selectedPatient) {
                        // If still not found, try to get from the editRecord
                        if (editRecord && editRecord.patientName !== 'Unknown') {
                          return `${editRecord.patientName} (ID: ${formData.patientId})`;
                        }
                        return `Patient ID: ${formData.patientId} (Not Found - Check Console)`;
                      }
                      
                      return `${selectedPatient.name} (ID: ${selectedPatient.id})`;
                    })()}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="recordType" className="text-sm font-medium text-gray-700 mb-2 block">Record Type</Label>
                  <Input
                    id="recordType"
                    type="text"
                    placeholder="Enter record type (e.g., Consultation, Diagnosis, Treatment)"
                    value={formData.recordType}
                    onChange={(e) => setFormData(prev => ({ ...prev, recordType: e.target.value }))}
                    className="border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="border-gray-200 rounded-lg"
                />
              </div>

              <div className="mb-6">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter medical record description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                  className="border-gray-200 rounded-lg"
                />
              </div>

              {/* Camera Section */}
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-blue-600" />
                    Instant Photo Capture
                  </h3>
                  <div className="space-x-2">
                    {!isCameraActive ? (
                      <Button type="button" onClick={startCamera} variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button type="button" onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Camera className="w-4 h-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button type="button" variant="outline" onClick={stopCamera} className="bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200">
                          Stop Camera
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Camera Preview */}
                  <div>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-64 bg-black rounded-lg border border-gray-200"
                      style={{ display: isCameraActive ? 'block' : 'none' }}
                    />
                    {!isCameraActive && (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <div className="text-center text-gray-500">
                          <Camera className="w-12 h-12 mx-auto mb-2" />
                          <p>Click "Start Camera" to begin</p>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                  
                  {/* Captured Photos Preview */}
                  <div>
                    <h4 className="font-medium mb-2 text-gray-700">Captured Photos ({capturedPhotos.length})</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-2">
                      {capturedPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={URL.createObjectURL(photo)}
                            alt={`Captured ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => {
                              setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
                              setFormData(prev => ({ 
                                ...prev, 
                                photoFiles: prev.photoFiles.filter((_, i) => i !== index) 
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-4 text-gray-800 flex items-center">
                  <Upload className="w-4 h-4 mr-2 text-purple-600" />
                  Upload Photos
                </h3>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePhotoFileUpload(e.target.files)}
                  className="mb-2 border-gray-200 rounded-lg"
                />
                {formData.photoFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected files: {formData.photoFiles.length}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-50 rounded-lg p-2">
                      {formData.photoFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                photoFiles: prev.photoFiles.filter((_, i) => i !== index) 
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Upload Section */}
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-4 text-gray-800 flex items-center">
                  <Upload className="w-4 h-4 mr-2 text-orange-600" />
                  Upload Documents
                </h3>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                  multiple
                  onChange={(e) => handleDocumentFileUpload(e.target.files)}
                  className="mb-2 border-gray-200 rounded-lg"
                />
                <p className="text-xs text-gray-600 mb-2">
                  Supported formats: PDF, Word, Excel, PowerPoint, Text, CSV, Images (Max 500MB per file)
                </p>
                {formData.documentFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected documents: {formData.documentFiles.length}
                    </p>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto">
                      {formData.documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded bg-white">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                {file.name.split('.').pop()?.toUpperCase() || 'DOC'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                documentFiles: prev.documentFiles.filter((_, i) => i !== index) 
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleSubmit}
                  disabled={isUpdatingRecords || !formData.patientId || !formData.description.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all duration-200"
                >
                  {isUpdatingRecords ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editRecord ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editRecord ? 'Update Record' : 'Add Record'
                  )}
                </Button>
              </div>
            </div>
            </div>
          </div>
          </DialogContent>
        </Dialog>

      {/* View Record Dialog - Glass Morphism Design */}
      {viewRecord && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewRecord(null)}
        >
          <div 
            className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl rounded-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Glass Morphism Style */}
            <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-t-xl"></div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                    <div className="w-full h-full flex items-center justify-center">
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Medical Record Details</span>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
                    <span className="text-gray-600">
                      Complete medical record information for {viewRecord.patientName}
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
            
            {/* Main content with proper scrolling */}
            <div 
              className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#60a5fa #dbeafe'
              }}
            >
              {/* Patient Information Cards */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Patient Information
                </h3>

                {/* Patient Details Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-white p-3 sm:p-4 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-blue-700 block">Patient Name</label>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{viewRecord.patientName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-white p-3 sm:p-4 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-purple-700 block">Patient ID</label>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{viewRecord.patientId}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-green-700 block">Joining Date</label>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">
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

                  <div className="bg-gradient-to-br from-orange-50 to-white p-3 sm:p-4 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-orange-700 block">Record Date</label>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{format(new Date(viewRecord.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-white p-3 sm:p-4 rounded-lg border border-indigo-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-indigo-700 block">Created By</label>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{viewRecord.createdBy}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* Add New Medical Record Form Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    Add New Medical Record
                  </h3>

                  <form onSubmit={handleAddRecord} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Record Date */}
                      <div className="space-y-2">
                        <Label htmlFor="add-record-date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Record Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="add-record-date"
                          type="date"
                          value={newRecord.date}
                          onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                          className="w-full bg-white/90 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-300"
                          required
                        />
                      </div>

                      {/* Record Type */}
                      <div className="space-y-2">
                        <Label htmlFor="add-record-type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Record Type <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="add-record-type"
                          type="text"
                          value={newRecord.recordType}
                          onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })}
                          className="w-full bg-white/90 backdrop-blur-sm border-purple-200 focus:border-purple-400 focus:ring-purple-300"
                          placeholder="Enter record type (e.g., Consultation, Prescription, Lab Report)"
                          required
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="add-record-description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Description
                      </Label>
                      <textarea
                        id="add-record-description"
                        value={newRecord.description}
                        onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                        className="w-full p-3 bg-white/90 backdrop-blur-sm border border-orange-200 rounded-md focus:border-orange-400 focus:ring-orange-300 min-h-[100px] resize-y"
                        placeholder="Enter detailed description of the medical record..."
                      />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="add-record-files" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Upload className="h-4 w-4 text-indigo-600" />
                        Upload Files (Images, Audio, Documents)
                      </Label>
                      <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-indigo-200 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                        <input
                          id="add-record-files"
                          type="file"
                          multiple
                          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileSelect}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supported: Images (JPG, PNG, GIF), Audio (MP3, WAV), Documents (PDF, DOC, TXT)
                        </p>
                      </div>

                      {/* File Preview */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {file.type.startsWith('image/') ? (
                                      <Image className="w-4 h-4 text-blue-600" />
                                    ) : file.type.startsWith('audio/') ? (
                                      <Mic className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <FileText className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                                    {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                  className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <Button
                        type="submit"
                        disabled={submitting || !newRecord.date || !newRecord.recordType?.trim()}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Adding Record...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Medical Record
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>



              {/* Medical History Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    Medical History
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialogMonthYearDialog(true)}
                    className="bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50 text-purple-700 text-xs sm:text-sm px-3 py-1.5 min-w-[140px]"
                  >
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {viewDialogFilterMonth !== null && viewDialogFilterYear !== null 
                      ? `${months[viewDialogFilterMonth - 1]} ${viewDialogFilterYear}`
                      : `${months[viewDialogSelectedMonth - 1]} ${viewDialogSelectedYear}`
                    }
                  </Button>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-purple-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 border-none">
                        <TableHead className="text-center font-semibold text-white">S NO</TableHead>
                        <TableHead className="text-center font-semibold text-white">Date</TableHead>
                        <TableHead className="text-center font-semibold text-white">Type</TableHead>
                        <TableHead className="text-center font-semibold text-white">Description</TableHead>
                        <TableHead className="text-center font-semibold text-white">Files</TableHead>
                        <TableHead className="text-center font-semibold text-white">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewedPatientMedicalRecords.map((record, index) => (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium">{index + 1}</TableCell>
                          <TableCell className="text-center">{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              <Badge variant="outline" className="capitalize">
                                {record.recordType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center max-w-xs truncate" title={record.description}>
                            {record.description || 'No description'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center gap-2">
                              {(() => {
                                console.log('🎯 Display check for record:', record.id, 'Images:', record.images, 'Length:', record.images?.length);
                                return record.images && record.images.length > 0;
                              })() ? (
                                <>
                                  <button
                                    onClick={() => {
                                      // Check if first file is an image
                                      const firstFile = record.images[0];
                                      const isImage = firstFile.includes('.jpg') || firstFile.includes('.jpeg') || 
                                                    firstFile.includes('.png') || firstFile.includes('.gif') || 
                                                    firstFile.includes('.bmp') || firstFile.includes('.webp');
                                      
                                      if (isImage) {
                                        // Filter only images for modal viewing
                                        const allImages = record.images.filter(path => 
                                          path.includes('.jpg') || path.includes('.jpeg') || 
                                          path.includes('.png') || path.includes('.gif') || 
                                          path.includes('.bmp') || path.includes('.webp')
                                        );
                                        setViewImageModal({ 
                                          show: true, 
                                          images: allImages, 
                                          currentIndex: 0,
                                          recordId: record.id 
                                        });
                                      } else {
                                        // For non-images, open in new tab
                                        const fileUrl = `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${record.images[0]}`;
                                        window.open(fileUrl, '_blank');
                                      }
                                    }}
                                    className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200 border flex items-center justify-center transition-colors"
                                    title={`View ${record.images.length} file${record.images.length > 1 ? 's' : ''}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        // Download first file
                                        const imagePath = record.images[0];
                                        const fileName = imagePath.split('/').pop() || 'file';
                                        const fileUrl = `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${imagePath}`;
                                        
                                        // Fetch the file as blob to force download
                                        const response = await fetch(fileUrl);
                                        const blob = await response.blob();
                                        
                                        // Create object URL and download
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = fileName;
                                        link.style.display = 'none';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                      } catch (error) {
                                        console.error('Download failed:', error);
                                        // Fallback to opening in new tab if download fails
                                        const fileUrl = `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000'}${record.images[0]}`;
                                        window.open(fileUrl, '_blank');
                                      }
                                    }}
                                    className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 border-green-200 border flex items-center justify-center transition-colors"
                                    title={`Download ${record.images.length} file${record.images.length > 1 ? 's' : ''}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm">No files</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              <button
                                onClick={() => {
                                  setDeleteRecord(record);
                                  setShowDeleteConfirm(true);
                                }}
                                className="action-btn-lead action-btn-delete w-8 h-8 rounded-lg flex items-center justify-center"
                                title="Delete Medical Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {viewedPatientMedicalRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No medical records found for this patient
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* View Dialog Month/Year Filter */}
      <Dialog open={showViewDialogMonthYearDialog} onOpenChange={setShowViewDialogMonthYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Medical History</DialogTitle>
            <DialogDescription>
              Select month and year to filter patient's medical history
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Month</Label>
              <select
                value={viewDialogSelectedMonth}
                onChange={(e) => setViewDialogSelectedMonth(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Year</Label>
              <select
                value={viewDialogSelectedYear}
                onChange={(e) => setViewDialogSelectedYear(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowViewDialogMonthYearDialog(false)}
              className="global-btn global-btn-secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setViewDialogFilterMonth(viewDialogSelectedMonth);
                setViewDialogFilterYear(viewDialogSelectedYear);
                setShowViewDialogMonthYearDialog(false);
              }}
              className="global-btn global-btn-primary"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="crm-modal-container">
          <DialogHeader className="editpopup form dialog-header">
            <div className="editpopup form icon-title-container">
              <div className="editpopup form dialog-icon">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="editpopup form title-description">
                <DialogTitle className="editpopup form dialog-title text-red-700">
                  Delete Medical Record
                </DialogTitle>
                <DialogDescription className="editpopup form dialog-description">
                  Are you sure you want to delete this medical record? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {deleteRecord && (
            <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{deleteRecord.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{format(new Date(deleteRecord.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteRecord.recordType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteRecord.description || 'No description'}</span>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">⚠️ This will permanently delete:</p>
                  <ul className="text-xs space-y-1">
                    <li>• The complete medical record</li>
                    <li>• All associated files and images</li>
                    <li>• All audio recordings</li>
                    <li>• Medical history entry</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteRecord(null);
              }}
              className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDelete}
              className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Delete Medical Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />

      {/* Month/Year Picker Dialog */}
      <MonthYearPickerDialog
        open={isMonthYearDialogOpen}
        onOpenChange={setIsMonthYearDialogOpen}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onApply={() => {
          setFilterMonth(selectedMonth);
          setFilterYear(selectedYear);
          setIsMonthYearDialogOpen(false);
          loadData(); // Use loadData instead of refreshData to preserve selected filters
        }}
        title="Select Month & Year"
        description="Filter medical records by specific month and year"
        previewText="medical records"
      />
      </div>
    </div>
  );
};

export default PatientMedicalRecord;
