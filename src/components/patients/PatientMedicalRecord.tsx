import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatabaseService } from '../../services/databaseService';
import MedicalRecordService from '../../services/medicalRecordService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { Camera, Mic, Image, Play, Pause, Download, Edit2, Loader2, RefreshCw, Trash2, Eye, Square, Upload, FileText } from 'lucide-react';
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
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);

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
    photoFiles: [] as File[]
  });

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
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
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
        
        const audioFile = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
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

  const refreshData = async () => {
    setRefreshCounter(prev => prev + 1);
    setIsLoadingRecords(true);
    
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
      const processedMedicalRecords = medicalRecordsData.map((record: any) => ({
        ...record,
        patientId: record.patient_id?.toString() || record.patientId?.toString() || '',
        patientName: record.patient_name || record.patientName || 'Unknown',
        recordType: record.record_type || record.recordType || 'consultation',
        images: Array.isArray(record.images) ? record.images : (record.images ? JSON.parse(record.images) : []),
        createdBy: record.created_by || record.createdBy || 'System',
        createdAt: record.created_at || record.createdAt || new Date().toISOString()
      }));

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
               (patient?.contactNumber && patient.contactNumber.toLowerCase().includes(searchLower)) ||
               (patient?.uhid && patient.uhid.toLowerCase().includes(searchLower));
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
  }, [records, patients, searchTerm, filterMonth, filterYear]);

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
      photoFiles: []
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
    setEditRecord(record);
    setFormData({
      patientId: record.patientId,
      recordType: record.recordType,
      description: record.description,
      date: record.date,
      audioFiles: [],
      photoFiles: []
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
        photoFiles: []
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
                <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 hover:text-blue-600">Patient Medical Records</h1>
              
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshData}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
                disabled={isLoadingPatients || isLoadingRecords}
                title="Reset to current data and refresh"
              >
                {isLoadingPatients || isLoadingRecords ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="font-medium">Refresh</span>
              </Button>
              
              <Button 
                onClick={exportToExcel}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
                title="Export records to Excel"
              >
                <Download className="h-4 w-4" />
                <span className="font-medium">Export Excel</span>
              </Button>
              
              <Button 
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
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
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{medicalRecords.length}</p>
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

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
            <div className="relative min-w-[300px]">
              <Input
                placeholder="Search by patient name, ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4"
              />
            </div>
            
            <button
              onClick={() => setShowMonthYearDialog(true)}
              className="modern-btn modern-btn-outline min-w-[150px] flex items-center justify-center"
            >
              {filterMonth !== null && filterYear !== null 
                ? `${months[filterMonth]} ${filterYear}`
                : 'Filter by Month'
              }
            </button>
            
            {(filterMonth !== null || filterYear !== null) && (
              <button
                onClick={() => {
                  setFilterMonth(null);
                  setFilterYear(null);
                }}
                className="modern-btn modern-btn-outline text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Medical Records</h2>
        </div>
        
        <div className="p-6">
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
                                {patient?.photo || patient?.photoUrl ? (
                                  <img
                                    src={patient.photo || patient.photoUrl}
                                    alt={`${record.patientName}'s photo`}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                      // Fallback to default avatar if image fails to load
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPGF0aCBkPSJNMjAgMTJDMTcuNzkgMTIgMTYgMTMuNzkgMTYgMTZDMTYgMTguMjEgMTcuNzkgMjAgMjAgMjBDMjIuMjEgMjAgMjQgMTguMjEgMjQgMTZDMjQgMTMuNzkgMjIuMjEgMTIgMjAgMTJaTTIwIDI2QzE2LjY7IDI2IDEwIDI3LjY3IDEwIDMxVjMySDMwVjMxQzMwIDI3LjY3IDIzLjMzIDI2IDIwIDI2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
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
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 border-green-200 hover:border-green-400 action-btn-edit rounded-lg flex items-center justify-center"
                                  title="View Patient Details"
                                >
                                  <Eye className="w-4 h-4" />
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
                    const selectedPatient = patients.find(p => p.id === formData.patientId);
                    return selectedPatient ? `${selectedPatient.name} (ID: ${selectedPatient.id})` : 'No patient selected';
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
                        window.open(fileUrl, '_blank');
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
                              {record.images && record.images.length > 0 ? (
                                <>
                                  <button
                                    onClick={() => {
                                      // View first file in new tab
                                      const fileUrl = `http://localhost:4000${record.images[0]}`;
                                      window.open(fileUrl, '_blank');
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

      {/* Month/Year Filter Dialog */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by Month & Year</DialogTitle>
            <DialogDescription>
              Select month and year to filter medical records
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Month</Label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMonthYearDialog(false)}>
              Cancel
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
      </div>
    </div>
  );
};

export default PatientMedicalRecord;
