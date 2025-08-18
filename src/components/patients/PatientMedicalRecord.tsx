import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatabaseService } from '../../services/databaseService';
import MedicalRecordService from '../../services/medicalRecordService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { Camera, Mic, Image, Play, Pause, Download, Edit2, Loader2, RefreshCw, Trash2, Eye, Square, Upload, FileText, Users, Activity, UserCheck, CalendarDays, Search, X, ChevronLeft, ChevronRight, ExternalLink, File } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Textarea } from '../../components/ui/textarea';
import { uploadMedicalHistoryFile, uploadPatientHistoryFile } from '../../services/simpleFileUpload';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearDialog, setShowMonthYearDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);

  // View dialog filtering
  const [viewDialogSelectedMonth, setViewDialogSelectedMonth] = useState(new Date().getMonth());
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
    const currentMonth = currentDate.getMonth();
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
        return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
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
        return recordDate.getMonth() === viewDialogFilterMonth && recordDate.getFullYear() === viewDialogFilterYear;
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
      ? `_${months[filterMonth]}_${filterYear}` 
      : '';
    
    XLSX.writeFile(wb, `Patient_Medical_Records${monthYearFilter}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `Medical records exported to Excel successfully!`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      
      {/* Image Viewer Modal */}
      {viewImageModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Medical Record Files ({viewImageModal.currentIndex + 1} of {viewImageModal.images.length})
              </h3>
              <button
                onClick={() => setViewImageModal({ show: false, images: [], currentIndex: 0, recordId: '' })}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col items-center">
              <div className="relative max-w-full max-h-[60vh] overflow-hidden rounded-lg">
                <img
                  src={`http://localhost:4000${viewImageModal.images[viewImageModal.currentIndex]}`}
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
                    link.href = `http://localhost:4000${viewImageModal.images[viewImageModal.currentIndex]}`;
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
                    window.open(`http://localhost:4000${viewImageModal.images[viewImageModal.currentIndex]}`, '_blank');
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
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient Medical Records</h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={refreshData}
                  disabled={isLoadingPatients || isLoadingRecords}
                  className="global-btn flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[100px]"
                >
                  {isLoadingPatients || isLoadingRecords ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">↻</span>
                </Button>
                
                {/* Month & Year Filter Button */}
                <Button 
                  type="button"
                  onClick={() => setShowMonthYearDialog(true)}
                  variant="outline"
                  className="modern-btn modern-btn-secondary flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2 lg:min-w-[120px]"
                >
                  <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth]} ${filterYear}`
                      : `${months[selectedMonth]} ${selectedYear}`
                    }
                  </span>
                  <span className="sm:hidden">
                    {filterMonth !== null && filterYear !== null 
                      ? `${months[filterMonth].slice(0, 3)} ${filterYear}`
                      : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`
                    }
                  </span>
                </Button>
              </div>
              

            </div>
          </div>
        </div>





        {/* Professional Stats Cards - Full Width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Active Patients</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">{patients.length}</p>
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
                  <Image className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Media Files</p>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{medicalRecords.reduce((acc, record) => acc + (record.images?.length || 0), 0)}</p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Section - Full Width */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Month & Year Filter Button for mobile */}
            <div className="block sm:hidden">
              <Button 
                type="button"
                onClick={() => setShowMonthYearDialog(true)}
                variant="outline"
                className="modern-btn modern-btn-secondary w-full text-sm px-4 py-2"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                {filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth]} ${filterYear}`
                  : `${months[selectedMonth]} ${selectedYear}`
                }
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
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Medical Records</h2>
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
                                {(() => {
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
                                        imageUrl = `/Photos/patient%20Admission/${record.patientId}/${patient.photo}`;
                                      }
                                    }
                                  } else if (patient?.photoUrl) {
                                    if (patient.photoUrl.startsWith('http')) {
                                      imageUrl = patient.photoUrl;
                                    } else if (patient.photoUrl.includes('Photos/patient Admission/')) {
                                      imageUrl = `/${patient.photoUrl.replace(/\s/g, '%20')}`;
                                    } else {
                                      imageUrl = `/Photos/patient%20Admission/${record.patientId}/${patient.photoUrl}`;
                                    }
                                  }

                                  return imageUrl ? (
                                    <>
                                      <img
                                        src={imageUrl}
                                        alt={`${record.patientName}'s photo`}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                        onError={(e) => {
                                          console.log('❌ Image failed for:', record.patientName);
                                          console.log('   Failed URL:', imageUrl);
                                          
                                          // Show fallback avatar
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const avatarDiv = target.nextElementSibling as HTMLElement;
                                          if (avatarDiv) avatarDiv.style.display = 'flex';
                                        }}
                                        onLoad={() => {
                                          console.log('✅ Image loaded successfully for patient:', record.patientName, 'URL:', imageUrl);
                                        }}
                                      />
                                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border border-gray-200" style={{display: 'none'}}>
                                        <span className="text-sm font-semibold text-white">
                                          {(record.patientName || 'P').charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center border border-gray-200">
                                      <span className="text-sm font-semibold text-white">
                                        {(record.patientName || 'P').charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  );
                                })()}
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
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 bg-green-100 hover:bg-green-200 border-green-200 hover:border-green-400 action-btn-edit rounded-lg"
                                  title="View Patient Details"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
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
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400 action-btn-edit rounded-lg transition-all duration-300"
                                  title={record.id.toString().startsWith('patient_') ? 'Add Medical Record' : 'Edit Medical Record'}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editRecord ? 'Edit Medical Record' : 'Add Medical Record'}
            </DialogTitle>
            <DialogDescription>
              {editRecord ? 'Update the medical record details below.' : 'Add a new medical record with audio and photo uploads.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Patient Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient">Patient *</Label>
                <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-700">
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
                <Label htmlFor="recordType">Record Type</Label>
                <Input
                  id="recordType"
                  type="text"
                  placeholder="Enter record type (e.g., Consultation, Diagnosis, Treatment)"
                  value={formData.recordType}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordType: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter medical record description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* Camera Section */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Instant Photo Capture
                </h3>
                <div className="space-x-2">
                  {!isCameraActive ? (
                    <Button type="button" onClick={startCamera} variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <>
                      <Button type="button" onClick={capturePhoto}>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button type="button" variant="outline" onClick={stopCamera}>
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
                    className="w-full h-64 bg-black rounded-lg"
                    style={{ display: isCameraActive ? 'block' : 'none' }}
                  />
                  {!isCameraActive && (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
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
                  <h4 className="font-medium mb-2">Captured Photos ({capturedPhotos.length})</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
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
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </h3>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoFileUpload(e.target.files)}
                className="mb-2"
              />
              {formData.photoFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected files: {formData.photoFiles.length}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </h3>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                multiple
                onChange={(e) => handleDocumentFileUpload(e.target.files)}
                className="mb-2"
              />
              <p className="text-xs text-muted-foreground mb-2">
                Supported formats: PDF, Word, Excel, PowerPoint, Text, CSV, Images (Max 500MB per file)
              </p>
              {formData.documentFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected documents: {formData.documentFiles.length}
                  </p>
                  <div className="space-y-2">
                    {formData.documentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded bg-gray-50">
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
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                setEditRecord(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isUpdatingRecords || !formData.patientId || !formData.description.trim()}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Record Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-primary">Patient Medical Record</DialogTitle>
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
                    <Label className="font-semibold text-muted-foreground">Record Type:</Label>
                    <Badge variant="outline" className="capitalize">
                      {viewRecord.recordType}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Date:</Label>
                    <p className="text-foreground font-medium">{format(new Date(viewRecord.date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Created By:</Label>
                    <p className="text-foreground font-medium">{viewRecord.createdBy}</p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {/* <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">Description</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-foreground">{viewRecord.description}</p>
                </div>
              </div> */}

              {/* Media Section */}
              {viewRecord.images && viewRecord.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Media Files ({viewRecord.images.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewRecord.images.map((imagePath, index) => {
                      const fileName = imagePath.split('/').pop() || `File ${index + 1}`;
                      const fileUrl = `http://localhost:4000${imagePath}`;
                      const isAudio = imagePath.includes('.mp3') || imagePath.includes('.wav') || imagePath.includes('.m4a');
                      const isImage = imagePath.includes('.jpg') || imagePath.includes('.jpeg') || imagePath.includes('.png') || imagePath.includes('.gif') || imagePath.includes('.bmp') || imagePath.includes('.webp');
                      
                      const handleDownload = () => {
                        const link = document.createElement('a');
                        link.href = fileUrl;
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      };

                      const handleView = () => {
                        if (isImage) {
                          // For images, open in modal
                          const allImages = viewRecord.images.filter(path => 
                            path.includes('.jpg') || path.includes('.jpeg') || 
                            path.includes('.png') || path.includes('.gif') || 
                            path.includes('.bmp') || path.includes('.webp')
                          );
                          const currentIndex = allImages.indexOf(imagePath);
                          setViewImageModal({ 
                            show: true, 
                            images: allImages, 
                            currentIndex: Math.max(0, currentIndex),
                            recordId: viewRecord.id 
                          });
                        } else {
                          // For non-images (audio, documents), open in new tab
                          window.open(fileUrl, '_blank');
                        }
                      };

                      return (
                        <div key={index} className="border rounded-lg p-4 bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {isAudio ? (
                                <Mic className="w-5 h-5 text-blue-600" />
                              ) : isImage ? (
                                <Image className="w-5 h-5 text-green-600" />
                              ) : (
                                <FileText className="w-5 h-5 text-gray-600" />
                              )}
                              <span className="text-sm font-medium truncate" title={fileName}>
                                {fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName}
                              </span>
                            </div>
                          </div>
                          
                          {isAudio && (
                            <div className="mb-3">
                              <audio controls className="w-full">
                                <source src={fileUrl} />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                          
                          {isImage && (
                            <div className="mb-3">
                              <img 
                                src={fileUrl}
                                alt={`Medical record ${index + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                            </div>
                          )}
                          
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleView}
                              className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              title="View in new tab"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownload}
                              className="flex items-center bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                              title="Download file"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Medical History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Medical History</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialogMonthYearDialog(true)}
                    className="min-w-[140px] text-sm"
                  >
                    {viewDialogFilterMonth !== null && viewDialogFilterYear !== null 
                      ? `${months[viewDialogFilterMonth]} ${viewDialogFilterYear}`
                      : `${months[viewDialogSelectedMonth]} ${viewDialogSelectedYear}`
                    }
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="text-center font-semibold">S NO</TableHead>
                        <TableHead className="text-center font-semibold">Date</TableHead>
                        <TableHead className="text-center font-semibold">Type</TableHead>
                        <TableHead className="text-center font-semibold">Description</TableHead>
                        <TableHead className="text-center font-semibold">Files</TableHead>
                        <TableHead className="text-center font-semibold">Action</TableHead>
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
                                        const fileUrl = `http://localhost:4000${record.images[0]}`;
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
                                        const fileUrl = `http://localhost:4000${imagePath}`;
                                        
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
                                        const fileUrl = `http://localhost:4000${record.images[0]}`;
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
                                className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 border-red-200 border flex items-center justify-center transition-colors"
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
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <Button variant="outline" onClick={() => setShowViewDialogMonthYearDialog(false)}>
              Cancel
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Medical Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this medical record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteRecord && (
            <div className="py-4">
              <div className="space-y-2 text-sm">
                <p><strong>Patient:</strong> {deleteRecord.patientName}</p>
                <p><strong>Date:</strong> {format(new Date(deleteRecord.date), 'dd/MM/yyyy')}</p>
                <p><strong>Type:</strong> {deleteRecord.recordType}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteRecord(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />

      {/* Month/Year Picker Dialog */}
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
