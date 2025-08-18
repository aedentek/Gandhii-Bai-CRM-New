// (moved below)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  Download, 
  Upload, 
  Mic, 
  Square, 
  Play, 
  Pause,
  File,
  Calendar,
  Volume2,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import { getFileUrl, uploadMedicalHistoryFile } from '@/services/simpleFileUpload';

interface DocumentWithData {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  data?: string; // Base64 data (legacy)
  filePath?: string; // Server file path (new)
}

interface HistoryRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  title: string;
  doctor: string;
  category: string;
  description: string;
  audioRecording?: {
    blob: Blob | null;
    url: string;
    duration: number;
    filePath?: string;
    fileName?: string;
  };
  audioFiles: File[]; // Changed from single audioFile to multiple audioFiles
  documents: DocumentWithData[]; // Changed to use custom interface
  createdAt: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string;
  admissionDate?: Date | null;
  status: string;
  attenderName: string;
  attenderPhone: string;
  photo: string;
  photoUrl: string;
  fees: number;
  bloodTest: number;
  pickupCharge: number;
  totalAmount: number;
  payAmount: number;
  balance: number;
  paymentType: string;
  created_at?: Date | null;
  createdAt?: Date | null;
  fatherName: string;
  motherName: string;
  attenderRelationship: string;
  dateOfBirth: Date;
  marriageStatus: string;
  employeeStatus: string;
}

interface Doctor {
  id: string;
  name: string;
}

const PatientHistory: React.FC = () => {
  // ...existing useState declarations...
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<HistoryRecord[]>([]); // Separate state for actual medical records
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0); // For forcing re-renders
  const [isUpdatingRecords, setIsUpdatingRecords] = useState(false); // Track when updating
  
  // Loading states for better UX
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewRecord, setViewRecord] = useState<HistoryRecord | null>(null);
  const [editRecord, setEditRecord] = useState<HistoryRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<HistoryRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioRecording, setAudioRecording] = useState<{blob: Blob | null, url: string, duration: number, filePath?: string, fileName?: string} | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // Audio playback speed
  
  // Form states
  const [formData, setFormData] = useState({
    patientId: '',
    doctor: '',
    title: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Add date field with today's date as default
    documents: [] as File[],
    audioFiles: [] as File[], // Changed from single audioFile to multiple audioFiles
    photoFiles: [] as File[] // Add photo files support
  });

  // State for existing documents when editing
  const [existingDocuments, setExistingDocuments] = useState<DocumentWithData[]>([]);

  // Month and year state for view dialog filtering
  const [viewDialogSelectedMonth, setViewDialogSelectedMonth] = useState(new Date().getMonth());
  const [viewDialogSelectedYear, setViewDialogSelectedYear] = useState(currentYear);
  const [showViewDialogMonthYearDialog, setShowViewDialogMonthYearDialog] = useState(false);
  const [viewDialogFilterMonth, setViewDialogFilterMonth] = useState<number | null>(null);
  const [viewDialogFilterYear, setViewDialogFilterYear] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to format patient ID as P0001
  const formatPatientId = (id: string | number): string => {
    // Convert to number, removing any existing P prefix and leading zeros
    const numericId = typeof id === 'string' ? parseInt(id.replace(/^P0*/, '')) : id;
    return `P${numericId.toString().padStart(4, '0')}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data in parallel for better performance
        const [patientsResult, doctorsResult, historyResult] = await Promise.allSettled([
          loadPatients(),
          loadDoctors(),
          loadHistoryRecords()
        ]);
        
        // Handle any failed promises
        if (patientsResult.status === 'rejected') {
          console.error('Failed to load patients:', patientsResult.reason);
        }
        if (doctorsResult.status === 'rejected') {
          console.error('Failed to load doctors:', doctorsResult.reason);
        }
        if (historyResult.status === 'rejected') {
          console.error('Failed to load history:', historyResult.reason);
        }
        
        setIsLoadingComplete(true);
      } catch (error) {
        console.error('Error in loadData:', error);
        setIsLoadingComplete(true);
      }
    };
    loadData();
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterYear]);

  // Reload medical records when refreshCounter changes (after form submission)
  useEffect(() => {
    if (refreshCounter > 0) {
      loadHistoryRecords();
    }
  }, [refreshCounter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      console.log('Attempting to load patients from DatabaseService...');
      const data = await DatabaseService.getAllPatients();
      console.log('Patients data received:', data);
      
      // Use the same parsing logic as PatientList component to ensure consistency
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
          status: p.status || 'Active',
          attenderName: p.attender_name || '',
          attenderPhone: p.attender_phone || '',
          photo: p.photo || '',
          photoUrl: p.photoUrl || p.photo_url || '',
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
          createdAt: parseDate(p.created_at)
        };
      });
      
      // Map to the format needed for PatientHistory
      const mappedPatients = parsedPatients.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        emergencyContact: p.emergencyContact,
        medicalHistory: p.medicalHistory,
        admissionDate: p.admissionDate,
        status: p.status,
        attenderName: p.attenderName,
        attenderPhone: p.attenderPhone,
        photo: p.photo,
        photoUrl: p.photoUrl,
        fees: p.fees,
        bloodTest: p.bloodTest,
        pickupCharge: p.pickupCharge,
        totalAmount: p.totalAmount,
        payAmount: p.payAmount,
        balance: p.balance,
        paymentType: p.paymentType,
        fatherName: p.fatherName,
        motherName: p.motherName,
        attenderRelationship: p.attenderRelationship,
        dateOfBirth: p.dateOfBirth,
        marriageStatus: p.marriageStatus,
        employeeStatus: p.employeeStatus
      }));
      
      setPatients(mappedPatients);
      console.log('Mapped patients with sample data:', mappedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      
      // Fallback: Try to load from localStorage as backup
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
            photoUrl: p.photoUrl || '',
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
            employeeStatus: p.employeeStatus || ''
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

  const loadDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const doctorsData = await DatabaseService.getAllDoctors();
      const mappedDoctors = doctorsData.map((d: any) => ({
        id: d.id,
        name: d.name
      }));
      setDoctors(mappedDoctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      
      // Fallback: Try to load from localStorage as backup
      const stored = localStorage.getItem('doctors');
      if (stored) {
        try {
          const parsedDoctors = JSON.parse(stored).map((d: any) => ({
            id: d.id,
            name: d.name
          }));
          setDoctors(parsedDoctors);
          toast({
            title: "Using Local Data",
            description: "Loaded doctors from local storage due to database connection issue",
            variant: "default",
          });
          return;
        } catch (e) {
          console.error('Failed to parse local storage doctors:', e);
        }
      }
      
      // If no local data, set empty array
      setDoctors([]);
      
      toast({
        title: "Warning",
        description: "Failed to load doctors from database. No doctors available.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const loadHistoryRecords = async () => {
    setIsLoadingHistory(true);
    console.log('🔄 Loading history records from database...');
    try {
      // Get all patient history records from database
      const records = await DatabaseService.getAllPatientHistory();
      console.log('📊 Raw records from database:', records.length, records);
      
      // Log each record's documents_info field specifically
      records.forEach((record, index) => {
        console.log(`📋 Record ${index + 1} (${record.id}):`, {
          patient_id: record.patient_id,
          patient_name: record.patient_name,
          documents_info_raw: record.documents_info,
          documents_info_type: typeof record.documents_info,
          documents_info_exists: !!record.documents_info,
          documents_info_length: record.documents_info?.length
        });
      });
      
      // Convert database format to component format
      const mappedRecords = records.map((record: any) => ({
        id: record.id,
        patientId: record.patient_id,
        patientName: record.patient_name,
        date: record.date,
        title: record.title,
        doctor: record.doctor,
        category: record.category,
        description: record.description,
        audioRecording: record.audio_recording ? {
          blob: null, // Server-side file, no blob available
          url: getFileUrl(record.audio_recording), // Use file path from server
          duration: record.audio_duration || 0,
          filePath: record.audio_recording,
          fileName: record.audio_file_name || 'audio.wav'
        } : undefined,
        audioFiles: record.audio_file_name ? [{ name: record.audio_file_name } as File] : [],
        documents: record.documents_info ? (() => {
          try {
            console.log(`🔧 Processing documents_info for record ${record.id}:`, record.documents_info);
            
            // Handle invalid cases
            if (!record.documents_info || record.documents_info === "0" || record.documents_info === "" || record.documents_info === "null") {
              console.log(`❌ Invalid documents_info for record ${record.id}`);
              return [];
            }
            
            let jsonString = record.documents_info;
            
            // Handle double-encoded JSON - if it starts and ends with quotes, it's double-encoded
            if (typeof jsonString === 'string' && jsonString.startsWith('"') && jsonString.endsWith('"')) {
              console.log(`🔧 Detected double-encoded JSON, removing outer quotes...`);
              jsonString = jsonString.slice(1, -1); // Remove outer quotes
              jsonString = jsonString.replace(/\\"/g, '"'); // Unescape inner quotes
            }
            
            console.log(`🧹 Processed JSON string:`, jsonString);
            
            const parsed = JSON.parse(jsonString);
            console.log(`✅ Parse successful for record ${record.id}:`, parsed);
            
            if (Array.isArray(parsed)) {
              const validDocs = parsed.filter(item => item && item.name);
              console.log(`📋 Valid documents found:`, validDocs.length, validDocs);
              return validDocs;
            } else if (parsed && parsed.name) {
              console.log(`📋 Single document found:`, parsed);
              return [parsed];
            }
            
            return [];
          } catch (error) {
            console.error('❌ All parsing attempts failed for record', record.id, ':', error);
            console.error('❌ Raw value:', record.documents_info);
            return [];
          }
        })() : [],
        createdAt: record.created_at
      }));
      
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
              status: p.status || 'Active'
            };
          });
        } catch (error) {
          console.error('Error loading patients for history:', error);
          allPatients = [];
        }
      }
      
      // Create comprehensive patient records by combining patient data with history
      const comprehensiveRecords: HistoryRecord[] = [];
      
      // DO NOT add medical records to main table - they should only appear in view popup
      // comprehensiveRecords.push(...mappedRecords); // REMOVED THIS LINE
      
      // For ALL patients, create basic patient registration entries for main table display
      allPatients.forEach(patient => {
        // Create patient registration entry for main table
        comprehensiveRecords.push({
          id: `patient_${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          date: new Date().toISOString().split('T')[0],
          title: 'Patient Registration',
          doctor: 'System',
          category: 'Registration',
          description: `Patient ${patient.name} registered in the system.`,
          documents: [],
          audioFiles: [], // Add audioFiles property
          createdAt: new Date().toISOString()
        });
      });
      
      // Store the actual medical records separately for view popup
      console.log('📥 Setting medical records state...', {
        recordsCount: mappedRecords.length,
        recordsWithDocuments: mappedRecords.filter(r => r.documents && r.documents.length > 0).length,
        p0040Records: mappedRecords.filter(r => r.patientId === 'P0040').map(r => ({
          id: r.id,
          documentsCount: r.documents?.length || 0,
          documents: r.documents
        }))
      });
      setMedicalRecords(mappedRecords);
      console.log('💾 Medical records set:', mappedRecords.length, mappedRecords);
      
      // Sort by date (newest first)
      comprehensiveRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistoryRecords(comprehensiveRecords);
    } catch (error) {
      console.error('Error loading patient history:', error);
      // Set empty array when database fails
      setHistoryRecords([]);
      toast({
        title: "Note",
        description: "Failed to load patient history from database",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveHistoryRecords = async (records: HistoryRecord[]) => {
    // This method is not needed anymore since we save directly to database
    setHistoryRecords(records);
  };

  // Optimized filtering with useMemo for better performance
  const filteredRecords = useMemo(() => {
    let filtered = historyRecords;

    // Filter to show only active patients
    filtered = filtered.filter(record => {
      const patient = patients.find(p => String(p.id) === String(record.patientId));
      return patient && patient.status === 'Active';
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchLower) ||
        record.patientName.toLowerCase().includes(searchLower) ||
        record.doctor.toLowerCase().includes(searchLower) ||
        record.patientId.toLowerCase().includes(searchLower)
      );
    }

    // Month & Year filtering
    if (filterMonth !== null && filterYear !== null) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
      });
    }

    // Group by patient to show unique patients only
    const uniquePatients = new Map();
    filtered.forEach(record => {
      if (!uniquePatients.has(record.patientId)) {
        uniquePatients.set(record.patientId, record);
      }
    });

    return Array.from(uniquePatients.values());
  }, [historyRecords, patients, searchTerm, filterMonth, filterYear]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Recording functions
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
    console.log('🎵 playAudio called with URL:', audioUrl, 'Record ID:', recordId);
    
    if (playingAudio === recordId) {
      console.log('🎵 Pausing currently playing audio');
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        console.log('🎵 Stopping previous audio');
        audioRef.current.pause();
      }
      
      console.log('🎵 Creating new Audio object with URL:', audioUrl);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.playbackRate = playbackSpeed; // Set playback speed
      
      // Add error handling
      audioRef.current.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        console.error('❌ Failed to load audio from URL:', audioUrl);
        setPlayingAudio(null);
        toast({
          title: "Audio Playback Error",
          description: `Failed to play audio file. Please check if the file exists and is accessible.`,
          variant: "destructive",
        });
      };
      
      // Add loading event
      audioRef.current.onloadstart = () => {
        console.log('🎵 Audio loading started');
      };
      
      audioRef.current.oncanplay = () => {
        console.log('🎵 Audio can play');
      };
      
      // Attempt to play
      audioRef.current.play()
        .then(() => {
          console.log('🎵 Audio playback started successfully');
          setPlayingAudio(recordId);
        })
        .catch((error) => {
          console.error('❌ Audio play() failed:', error);
          setPlayingAudio(null);
          toast({
            title: "Audio Playback Error",
            description: `Failed to start audio playback: ${error.message}`,
            variant: "destructive",
          });
        });
      
      audioRef.current.onended = () => {
        console.log('🎵 Audio playback ended');
        setPlayingAudio(null);
      };
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const downloadAudio = (audioUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${filename}.wav`;
    a.click();
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }));
    }
  };

  const handleAudioFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
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

  const handlePhotoFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      
      const invalidFiles = newFiles.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: `Photo files larger than 50MB are not allowed.`,
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

  const removePhotoFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctor: '',
      title: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0], // Add date field
      documents: [],
      audioFiles: [], // Changed from audioFile: null
      photoFiles: [] // Add photo files reset
    });
    setAudioRecording(null);
    setRecordingTime(0);
    setEditRecord(null); // Clear edit state when resetting form
    setExistingDocuments([]); // Clear existing documents
  };

  const handleSubmit = async () => {
    console.log('🔥 handleSubmit called');
    console.log('📝 Form data:', formData);
    console.log('📝 Edit record:', editRecord);
    
    if (!formData.patientId || !formData.doctor || !formData.date) {
      console.log('❌ Validation failed:', {
        patientId: formData.patientId,
        doctor: formData.doctor,
        date: formData.date
      });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Patient, Doctor, Date).",
        variant: "destructive",
      });
      return;
    }

    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    try {
      const isEditing = editRecord !== null;
      const recordId = isEditing ? editRecord.id : `history_${Date.now()}`;
      
      // Upload audio files to server
      let audioFilePath = null;
      let audioFileName = null;
      let audioDuration = 0;
      
      // Handle recorded audio first
      if (audioRecording) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', audioRecording.blob, `audio-${Date.now()}.wav`);
          uploadFormData.append('patientId', formData.patientId);
          uploadFormData.append('fileType', 'audio');
          
          const response = await fetch('/api/upload-medical-history-file', {
            method: 'POST',
            body: uploadFormData,
          });
          
          if (response.ok) {
            const result = await response.json();
            audioFilePath = result.filePath;
            audioFileName = `audio-${Date.now()}.wav`;
            audioDuration = audioRecording.duration;
            console.log('✅ Audio uploaded:', audioFilePath);
          } else {
            const errorText = await response.text();
            console.error('❌ Audio upload failed:', response.status, errorText);
            throw new Error(`Audio upload failed: ${response.status}`);
          }
        } catch (error) {
          console.error('❌ Audio upload error:', error);
          throw error;
        }
      }

      // Handle uploaded audio files - for now, use the first one if recorded audio doesn't exist
      if (!audioRecording && formData.audioFiles.length > 0) {
        try {
          const firstAudioFile = formData.audioFiles[0];
          const filePath = await uploadMedicalHistoryFile(firstAudioFile, formData.patientId, 'audio');
          audioFilePath = filePath;
          audioFileName = firstAudioFile.name;
          audioDuration = 0; // Duration will be calculated later if needed
          console.log('✅ Audio file uploaded:', filePath);
        } catch (error) {
          console.error('❌ Audio file upload failed:', error);
          throw error;
        }
      }

      // Handle document uploads
      const documentsInfo = [...existingDocuments];
      for (const doc of formData.documents) {
        try {
          const filePath = await uploadMedicalHistoryFile(doc, formData.patientId, 'document');
          documentsInfo.push({
            name: doc.name,
            size: doc.size,
            type: doc.type,
            lastModified: doc.lastModified,
            filePath: filePath
          });
          console.log('✅ Document uploaded:', filePath);
        } catch (error) {
          console.error('❌ Document upload failed:', error);
        }
      }

      // Handle photo uploads
      for (const photo of formData.photoFiles) {
        try {
          const filePath = await uploadMedicalHistoryFile(photo, formData.patientId, 'document');
          documentsInfo.push({
            name: photo.name,
            size: photo.size,
            type: photo.type,
            lastModified: photo.lastModified,
            filePath: filePath
          });
          console.log('✅ Photo uploaded:', filePath);
        } catch (error) {
          console.error('❌ Photo upload failed:', error);
        }
      }

      const dbRecord = {
        id: recordId,
        patient_id: formData.patientId,
        patient_name: patient.name,
        date: formData.date,
        title: formData.title || 'Medical Record',
        doctor: formData.doctor,
        category: formData.category || 'General',
        description: formData.description,
        audio_recording: audioFilePath,
        audio_file_name: audioFileName,
        audio_duration: audioDuration,
        documents_info: documentsInfo.length > 0 ? JSON.stringify(documentsInfo) : null
      };

      if (isEditing) {
        console.log('🔄 Updating record:', recordId, dbRecord);
        await DatabaseService.updatePatientHistory(recordId, dbRecord);
        toast({
          title: "Record Updated",
          description: "Medical record has been updated successfully.",
        });
      } else {
        console.log('➕ Adding new record:', dbRecord);
        await DatabaseService.addPatientHistory(dbRecord);
        toast({
          title: "Record Added",
          description: "Medical record has been added successfully.",
        });
      }

      // Reset form and close dialog
      resetForm();
      setShowAddDialog(false);
      setRefreshCounter(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save medical record.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: HistoryRecord) => {
    // Find the patient in the patients list to ensure it exists
    const patient = patients.find(p => p.id === record.patientId);
    
    // FIRST: Set the record being edited BEFORE setting form data
    setEditRecord({ ...record });
    
    // THEN: Set form data with the record values for editing
    setFormData({
      patientId: record.patientId,
      doctor: record.doctor,
      title: record.title || '',
      category: record.category || '',
      description: record.description,
      date: record.date || new Date().toISOString().split('T')[0], // Add date field
      documents: [], // For edit mode, we'll show existing documents separately
      audioFiles: record.audioFiles || [],
      photoFiles: [] // For edit mode, we'll show existing photos within documents
    });
    
    // Set existing documents for display in edit mode
    setExistingDocuments(record.documents || []);
    
    // Set audio recording if exists
    if (record.audioRecording) {
      setAudioRecording(record.audioRecording);
    }
    
    // Finally: Open the dialog
    setShowAddDialog(true);
  };

  const handleDelete = (record: HistoryRecord) => {
    setDeleteRecord(record);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFromViewPopup = (record: HistoryRecord) => {
    setDeleteRecord(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;

    try {
      // Delete from database (no special handling for sample records)
      await DatabaseService.deletePatientHistory(deleteRecord.id);
      
      // Reload records from database
      await loadHistoryRecords();
      
      // Force refresh of view popup if it's open
      setRefreshCounter(prev => prev + 1);
      
      setShowDeleteConfirm(false);
      setDeleteRecord(null);
      
      toast({
        title: "Record Deleted",
        description: "Patient history record has been successfully deleted from database.",
      });
    } catch (error) {
      console.error('Error deleting patient history:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient history record from database.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => {
      const patient = patients.find(p => String(p.id) === String(record.patientId));
      const joiningDate = patient && patient.admissionDate 
        ? format(new Date(patient.admissionDate), 'dd/MM/yyyy') 
        : 'N/A';
      
      return {
        'S NO': filteredRecords.indexOf(record) + 1,
        'Joining Date': joiningDate,
        'Patient ID': record.patientId,
        'Patient Name': record.patientName,
        'Has Audio': record.audioRecording || (record.audioFiles && record.audioFiles.length > 0) ? 'Yes' : 'No',
        'Documents': record.documents.length
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patient History');
    XLSX.writeFile(wb, `patient-history-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: "Patient history exported to Excel file",
    });
  };

  const exportToPDF = () => {
    const htmlContent = `
      <html>
        <head>
          <title>Patient History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Patient History Report</h1>
            <h2>Generated on: ${format(new Date(), 'dd/MM/yyyy')}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>S NO</th>
                <th>Joining Date</th>
                <th>Patient Id</th>
                <th>Patient Name</th>
                <th>Audio</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map((record, index) => {
                const patient = patients.find(p => String(p.id) === String(record.patientId));
                const joiningDate = patient && patient.admissionDate 
                  ? format(new Date(patient.admissionDate), 'dd/MM/yyyy') 
                  : 'N/A';
                  
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${joiningDate}</td>
                    <td>${record.patientId}</td>
                    <td>${record.patientName}</td>
                    <td>${record.audioRecording || (record.audioFiles && record.audioFiles.length > 0) ? 'Yes' : 'No'}</td>
                    <td>${record.documents.length} files</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-history-${format(new Date(), 'yyyy-MM-dd')}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Patient history exported to PDF file",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to calculate audio and document counts for a patient based on main page filter
  const getPatientFileCounts = (patientId: string) => {
    // Count from medical records (actual database records), not history records
    let patientMedicalRecords = medicalRecords.filter(record => {
      const recordPatientId = String(record.patientId).replace(/^P0*/, '');
      const targetPatientId = String(patientId).replace(/^P0*/, '');
      return recordPatientId === targetPatientId;
    });

    // Apply main page month/year filtering
    if (filterMonth !== null && filterYear !== null) {
      patientMedicalRecords = patientMedicalRecords.filter(record => {
        const recordDate = new Date(record.date || record.createdAt);
        return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
      });
    }

    // Calculate total audio files count from medical records
    let totalAudioCount = 0;
    patientMedicalRecords.forEach(record => {
      // Count each record as having at most 1 audio file to avoid double counting
      // Priority: audioRecording over audioFiles to avoid counting the same file twice
      if (record.audioRecording) {
        totalAudioCount += 1;
      } else if (record.audioFiles && record.audioFiles.length > 0) {
        totalAudioCount += record.audioFiles.length;
      }
    });

    // Calculate total documents count from medical records
    const totalDocumentsCount = patientMedicalRecords.reduce((count, record) => {
      const docCount = record.documents ? record.documents.length : 0;
      console.log(`🔍 Document count for record ${record.id}:`, {
        recordId: record.id,
        documentsExists: !!record.documents,
        documentsArray: record.documents,
        documentsLength: docCount,
        currentCount: count,
        newCount: count + docCount
      });
      return count + docCount;
    }, 0);

    // Debug logging for patient P0040 to see what's happening
    if (String(patientId).includes('40')) {
      console.log(`Debug P0040 counts:`, {
        patientId,
        medicalRecordsTotal: medicalRecords.length,
        patientMedicalRecordsCount: patientMedicalRecords.length,
        totalAudioCount,
        totalDocumentsCount,
        allMedicalRecords: medicalRecords.map(r => ({
          id: r.id,
          patientId: r.patientId,
          documentsCount: r.documents?.length || 0,
          documentsDetails: r.documents,
          rawDocuments: r.documents
        })),
        recordsDetails: patientMedicalRecords.map(r => ({
          id: r.id,
          patientId: r.patientId,
          audioRecording: !!r.audioRecording,
          audioFiles: r.audioFiles?.length || 0,
          documents: r.documents?.length || 0,
          documentsArray: r.documents,
          documentsDetails: r.documents?.map(d => ({ 
            name: d?.name || 'Unknown', 
            filePath: d?.filePath || 'No path' 
          })) || []
        }))
      });
    }

    return { audioCount: totalAudioCount, documentsCount: totalDocumentsCount };
  };

  // Memoized medical records for the currently viewed patient (from patient_history table)
  const viewedPatientMedicalRecords = useMemo(() => {
    if (!viewRecord) return [];
    
    let records = medicalRecords.filter(record => {
      // Handle both string and number comparisons for patient ID
      const recordPatientId = String(record.patientId).replace(/^P0*/, '');
      const viewPatientId = String(viewRecord.patientId).replace(/^P0*/, '');
      return recordPatientId === viewPatientId;
    });

    // Apply view dialog month/year filtering
    if (viewDialogFilterMonth !== null && viewDialogFilterYear !== null) {
      records = records.filter(record => {
        const recordDate = new Date(record.date || record.createdAt);
        return recordDate.getMonth() === viewDialogFilterMonth && recordDate.getFullYear() === viewDialogFilterYear;
      });
    }
    
    return records;
  }, [medicalRecords, viewRecord?.patientId, refreshCounter, viewDialogFilterMonth, viewDialogFilterYear]);

    return (
      <div className="crm-page-bg">
        {/* Header */}
        <div className="crm-header-container">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="crm-header-icon">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient History</h1>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => {
                  console.log('🔵 Add Record button clicked');
                  setShowAddDialog(true);
                }}
                className="global-btn global-btn-primary flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{patients.filter(p => p.status === 'Active').length}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">In treatment</span>
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
                      // Count audio files from medical records, not history records
                      let filteredMedicalRecords = medicalRecords;
                      
                      // Apply same filtering as main table
                      if (searchTerm) {
                        const searchLower = searchTerm.toLowerCase();
                        filteredMedicalRecords = filteredMedicalRecords.filter(record =>
                          record.title.toLowerCase().includes(searchLower) ||
                          record.patientName.toLowerCase().includes(searchLower) ||
                          record.doctor.toLowerCase().includes(searchLower) ||
                          record.patientId.toLowerCase().includes(searchLower)
                        );
                      }

                      // Month & Year filtering
                      if (filterMonth !== null && filterYear !== null) {
                        filteredMedicalRecords = filteredMedicalRecords.filter(record => {
                          const recordDate = new Date(record.date);
                          return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
                        });
                      }

                      // Filter to show only active patients
                      filteredMedicalRecords = filteredMedicalRecords.filter(record => {
                        const patient = patients.find(p => String(p.id) === String(record.patientId));
                        return patient && patient.status === 'Active';
                      });

                      filteredMedicalRecords.forEach(record => {
                        // Count each record as having at most 1 audio file to avoid double counting
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
                    <Volume2 className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Recordings</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-green">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="crm-stat-card crm-stat-card-purple">
            <CardContent className="relative p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1 truncate">Documents</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
                    {(() => {
                      let totalDocumentCount = 0;
                      // Count documents from medical records, not history records
                      let filteredMedicalRecords = medicalRecords;
                      
                      // Apply same filtering as main table
                      if (searchTerm) {
                        const searchLower = searchTerm.toLowerCase();
                        filteredMedicalRecords = filteredMedicalRecords.filter(record =>
                          record.title.toLowerCase().includes(searchLower) ||
                          record.patientName.toLowerCase().includes(searchLower) ||
                          record.doctor.toLowerCase().includes(searchLower) ||
                          record.patientId.toLowerCase().includes(searchLower)
                        );
                      }

                      // Month & Year filtering
                      if (filterMonth !== null && filterYear !== null) {
                        filteredMedicalRecords = filteredMedicalRecords.filter(record => {
                          const recordDate = new Date(record.date);
                          return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
                        });
                      }

                      // Filter to show only active patients
                      filteredMedicalRecords = filteredMedicalRecords.filter(record => {
                        const patient = patients.find(p => String(p.id) === String(record.patientId));
                        return patient && patient.status === 'Active';
                      });

                      filteredMedicalRecords.forEach(record => {
                        if (record.documents && record.documents.length > 0) {
                          totalDocumentCount += record.documents.length;
                        }
                      });
                      return totalDocumentCount;
                    })()}
                  </p>
                  <div className="flex items-center text-xs text-purple-600">
                    <File className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Files</span>
                  </div>
                </div>
                <div className="crm-stat-icon crm-stat-icon-purple">
                  <File className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="crm-controls-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={exportToExcel} 
                className="global-btn global-btn-secondary flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button 
                onClick={exportToPDF} 
                className="global-btn global-btn-secondary flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>

            {/* Month & Year Selector */}
            <Button
              type="button"
              variant="outline"
              className="crm-month-year-btn"
              onClick={() => setShowMonthYearDialog(true)}
            >
              <Calendar className="crm-month-year-btn-icon" />
              <span className="crm-month-year-btn-text">
                {filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth]} ${filterYear}`
                  : `${months[selectedMonth]} ${selectedYear}`
                }
              </span>
              <span className="crm-month-year-btn-text-mobile">
                {filterMonth !== null && filterYear !== null 
                  ? `${months[filterMonth].slice(0, 3)} ${filterYear}`
                  : `${months[selectedMonth].slice(0, 3)} ${selectedYear}`
                }
              </span>
            </Button>
          </div>
        </div>

        {/* Records Table */}
        <div className="crm-table-container">
          <div className="crm-table-header">
            <div className="crm-table-title">
              <FileText className="crm-table-title-icon" />
              <h2 className="crm-table-title-text">Patients Medical Records</h2>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
          {/* Loading Indicator */}
          {(!isLoadingComplete && (isLoadingPatients || isLoadingDoctors || isLoadingHistory)) && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="text-sm text-gray-600">
                  Loading data...
                  {isLoadingPatients && " (Patients)"}
                  {isLoadingDoctors && " (Doctors)"}
                  {isLoadingHistory && " (History)"}
                </div>
              </div>
            </div>
          )}
          
          {/* Table Content */}
          {isLoadingComplete && (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">S NO</TableHead>
                  <TableHead className="text-center">Photo</TableHead>
                  <TableHead className="text-center">Patient Id</TableHead>
                  <TableHead className="text-center">Patient Name</TableHead>
                  <TableHead className="text-center">Audio</TableHead>
                  <TableHead className="text-center">Document</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords
                  .sort((a, b) => {
                    // Sort by Patient ID in ascending order
                    // Extract numeric part from Patient IDs (e.g., "P0042" -> 42)
                    const patientIdA = parseInt(String(a.patientId).replace(/\D/g, '')) || 0;
                    const patientIdB = parseInt(String(b.patientId).replace(/\D/g, '')) || 0;
                    return patientIdA - patientIdB;
                  })
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((record, idx) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="text-center font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        {(() => {
                          const patient = patients.find(p => String(p.id) === String(record.patientId));
                          const formattedPatientId = formatPatientId(record.patientId);
                          
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
                                // Assume it's just filename and build full path using formatted Patient ID
                                imageUrl = `/Photos/patient%20Admission/${formattedPatientId}/${patient.photo}`;
                              }
                            }
                          } else if (patient?.photoUrl) {
                            if (patient.photoUrl.startsWith('http')) {
                              imageUrl = patient.photoUrl;
                            } else if (patient.photoUrl.includes('Photos/patient Admission/')) {
                              imageUrl = `/${patient.photoUrl.replace(/\s/g, '%20')}`;
                            } else {
                              imageUrl = `/Photos/patient%20Admission/${formattedPatientId}/${patient.photoUrl}`;
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
                    <TableCell className="text-center">
                      <div className="font-medium">{record.patientName}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const fileCounts = getPatientFileCounts(record.patientId);
                        return fileCounts.audioCount > 0 ? (
                          <div className="flex justify-center items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Find the first audio record for this patient to play
                                const firstAudioRecord = medicalRecords.find(medicalRecord => {
                                  const medicalPatientId = String(medicalRecord.patientId).replace(/^P0*/, '');
                                  const currentPatientId = String(record.patientId).replace(/^P0*/, '');
                                  return medicalPatientId === currentPatientId && medicalRecord.audioRecording;
                                });
                                if (firstAudioRecord?.audioRecording) {
                                  playAudio(firstAudioRecord.audioRecording.url, firstAudioRecord.id);
                                }
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full w-8 h-8 p-0"
                              title={`${fileCounts.audioCount} audio recording${fileCounts.audioCount > 1 ? 's' : ''} available`}
                            >
                              <span className="text-sm font-semibold">{fileCounts.audioCount}</span>
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
                      {(() => {
                        const fileCounts = getPatientFileCounts(record.patientId);
                        return fileCounts.documentsCount > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              try {
                                // Find the first medical record with documents for this patient
                                const firstRecordWithDocs = medicalRecords.find(medicalRecord => {
                                  const medicalPatientId = String(medicalRecord.patientId).replace(/^P0*/, '');
                                  const currentPatientId = String(record.patientId).replace(/^P0*/, '');
                                  return medicalPatientId === currentPatientId && medicalRecord.documents && medicalRecord.documents.length > 0;
                                });
                                
                                if (firstRecordWithDocs && firstRecordWithDocs.documents && firstRecordWithDocs.documents.length > 0) {
                                  const firstDoc = firstRecordWithDocs.documents[0];
                                  if (firstDoc && firstDoc.filePath) {
                                    const fileUrl = getFileUrl(firstDoc.filePath);
                                    window.open(fileUrl, '_blank');
                                  } else if (firstDoc && firstDoc.data) {
                                    // Legacy base64 data
                                    const byteCharacters = atob(firstDoc.data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: firstDoc.type || 'application/octet-stream' });
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                  }
                                }
                              } catch (error) {
                                console.error('Error opening document:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to open document",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full w-8 h-8 p-0"
                            title={`${fileCounts.documentsCount} document${fileCounts.documentsCount > 1 ? 's' : ''} available - Click to view`}
                          >
                            <span className="text-sm font-semibold">{fileCounts.documentsCount}</span>
                          </Button>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className="bg-gray-50 text-gray-400 border-gray-200"
                          >
                            0
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex space-x-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewRecord(record)}
                          title="View Details"
                          className="action-btn-lead action-btn-view"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {record.id.startsWith('patient_') ? (
                          // For basic patient records, show add history option
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                patientId: record.patientId,
                                doctor: '',
                                title: '',
                                category: '',
                                description: '',
                                date: new Date().toISOString().split('T')[0], // Add date field
                                documents: [],
                                audioFiles: [],
                                photoFiles: []
                              });
                              setShowAddDialog(true);
                            }}
                            title="Add Medical Record"
                            className="action-btn-lead action-btn-success"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          // For actual medical records, show edit option
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            title="Edit Record"
                            className="action-btn-lead action-btn-edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {!record.id.startsWith('patient_') && (
                          // Only show delete for actual medical records, not basic patient entries
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="action-btn-lead action-btn-delete"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              
            </Table>
            
            {filteredRecords.length === 0 && isLoadingComplete && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-4">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Patient Records Found</h3>
                <p className="text-sm">No patients or medical records are available to display.</p>
                <p className="text-sm mt-1">Add patients and create medical records to see them here.</p>
              </div>
            )}
          </div>
          )}

          {/* Pagination */}
          {filteredRecords.length > itemsPerPage && (
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

      {/* Add/Edit Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          resetForm(); // Reset form when dialog is closed
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit2 className="w-5 h-5" />
              <span>{editRecord ? 'Edit Medical Record' : 'Add Medical Record'}</span>
            </DialogTitle>
            <DialogDescription>
              {editRecord ? 'Update patient medical record' : 'Create a new patient medical record'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                {(editRecord || (formData.patientId && showAddDialog)) ? (
                  // When editing or when we have a pre-selected patient, show patient name as disabled input
                  <Input
                    value={editRecord 
                      ? `${editRecord.patientName || 'Unknown Patient'} (${editRecord.patientId})`
                      : (() => {
                          // More flexible patient matching - try different ID formats
                          const findPatient = () => {
                            const targetId = formData.patientId;
                            // Try exact match first
                            let patient = patients.find(p => p.id === targetId);
                            if (patient) return patient;
                            
                            // Try matching with string conversion
                            patient = patients.find(p => String(p.id) === String(targetId));
                            if (patient) return patient;
                            
                            // Try matching formatted ID (P0101) with numeric ID (101)
                            const numericId = String(targetId).replace(/^P0*/, '');
                            patient = patients.find(p => String(p.id) === numericId);
                            if (patient) return patient;
                            
                            // Try matching numeric ID with formatted ID in patients
                            const formattedId = `P${String(targetId).padStart(4, '0')}`;
                            patient = patients.find(p => p.id === formattedId);
                            if (patient) return patient;
                            
                            return null;
                          };
                          
                          const patient = findPatient();
                          return `${patient?.name || 'Unknown Patient'} (${formData.patientId})`;
                        })()
                    }
                    disabled={true}
                    className="bg-muted"
                  />
                ) : (
                  // When adding completely new record without pre-selection, show dropdown
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) => setFormData({...formData, patientId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient">
                        {formData.patientId && patients.find(p => p.id === formData.patientId) && (
                          `${patients.find(p => p.id === formData.patientId)?.name} (${formData.patientId})`
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} ({patient.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select
                value={formData.doctor}
                onValueChange={(value) => setFormData({...formData, doctor: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.name}>
                      {doctor.name} ({doctor.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Registration">Registration</SelectItem>
                    <SelectItem value="Lab Results">Lab Results</SelectItem>
                    <SelectItem value="Prescription">Prescription</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter detailed description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            {/* Audio Recording Section */}
            <div className="space-y-2">
              <Label>Audio Recording</Label>
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {isRecording ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop ({formatDuration(recordingTime)})
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={startRecording}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Record
                    </Button>
                  )}
                </div>
                
                {audioRecording && (
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => playAudio(audioRecording.url, 'preview')}
                    >
                      {playingAudio === 'preview' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Cycle through speed options: 0.5x, 1x, 1.25x, 1.5x, 2x
                        const speeds = [0.5, 1, 1.25, 1.5, 2];
                        const currentIndex = speeds.indexOf(playbackSpeed);
                        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                        setPlaybackSpeed(nextSpeed);
                        // Update current audio if playing
                        if (audioRef.current && playingAudio === 'preview') {
                          audioRef.current.playbackRate = nextSpeed;
                        }
                      }}
                      title={`Playback Speed: ${playbackSpeed}x`}
                    >
                      <span className="text-xs font-mono">{playbackSpeed}x</span>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Duration: {formatDuration(audioRecording.duration)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAudioRecording(null)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Audio File Upload */}
              <div className="mt-2">
                <Label>Or Upload Audio Files (Multiple files supported, up to 500MB each)</Label>
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
                          <File className="w-4 h-4" />
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

            {/* Document Upload */}
            <div className="space-y-2">
              <Label>Documents</Label>
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              
              {/* Show existing documents when editing */}
              {existingDocuments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Existing Documents:</Label>
                  {existingDocuments.map((doc, index) => (
                    <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded border-blue-200 border">
                      <div className="flex items-center space-x-2">
                        <File className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800">{doc.name}</span>
                        <span className="text-xs text-blue-600">({(doc.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Download existing document - handle both legacy base64 and new server files
                            if (doc.filePath) {
                              // New server-side file - download directly from server
                              const fileUrl = getFileUrl(doc.filePath);
                              const a = document.createElement('a');
                              a.href = fileUrl;
                              a.download = doc.name;
                              a.target = '_blank';
                              a.click();
                            } else if (doc.data) {
                              // Legacy base64 data
                              const byteCharacters = atob(doc.data);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: doc.type });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = doc.name;
                              a.click();
                              URL.revokeObjectURL(url);
                            } else {
                              toast({
                                title: "Download Error",
                                description: "Document data is not available for download.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Remove existing document
                            setExistingDocuments(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show newly uploaded documents */}
              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">New Documents:</Label>
                  {formData.documents.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <File className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo-upload">Upload Photos</Label>
              <Input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoFileUpload(e.target.files)}
              />
              
              {/* Show newly uploaded photos */}
              {formData.photoFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Selected Photos:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.photoFiles.map((file, index) => (
                      <div key={`photo-${index}`} className="relative">
                        <img 
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
                          onClick={() => removePhotoFile(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <div className="text-xs text-center mt-1 text-muted-foreground truncate">
                          {file.name}
                        </div>
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
                resetForm(); // Reset form when canceling
              }}
              className="global-btn global-btn-secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="global-btn global-btn-primary"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {editRecord ? 'Update Record' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Record Dialog - Settlement History Style */}
      {viewRecord && (
        <Dialog key={`view-dialog-${viewRecord.patientId}-${refreshCounter}-${medicalRecords.length}`} open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-primary">Patient History</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Patient Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary">Patient Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Patient Photo */}
                  <div className="flex items-center space-x-4 col-span-2 md:col-span-3 mb-4">
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

                      return imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={`${viewRecord.patientName}'s photo`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              console.log('❌ Image failed for:', viewRecord.patientName);
                              console.log('   Failed URL:', imageUrl);
                              
                              // Show fallback avatar
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const avatarDiv = target.nextElementSibling as HTMLElement;
                              if (avatarDiv) avatarDiv.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully for patient:', viewRecord.patientName, 'URL:', imageUrl);
                            }}
                          />
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200" style={{display: 'none'}}>
                            <span className="text-lg font-semibold text-white">
                              {(viewRecord.patientName || 'P').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-gray-200">
                          <span className="text-lg font-semibold text-white">
                            {(viewRecord.patientName || 'P').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-xl font-semibold text-foreground">{viewRecord.patientName}</p>
                      <p className="text-sm text-muted-foreground">Patient ID: {formatPatientId(viewRecord.patientId)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="font-semibold text-muted-foreground">Patient Name:</Label>
                    <p className="text-foreground font-medium">{viewRecord.patientName}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-muted-foreground">Patient ID:</Label>
                    <p className="text-foreground font-medium">{formatPatientId(viewRecord.patientId)}</p>
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

              {/* Month & Year Filter for Medical History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Medical History</h3>
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
                        <TableHead className="text-center font-semibold">Doctor</TableHead>
                        <TableHead className="text-center font-semibold">Description</TableHead>
                        <TableHead className="text-center font-semibold">Documents</TableHead>
                        <TableHead className="text-center font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Get all medical records for this patient */}
                      {viewedPatientMedicalRecords.map((record, index) => (
                          <TableRow key={record.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="text-center">{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-center">{record.doctor}</TableCell>
                            <TableCell className="text-center max-w-xs truncate" title={record.description}>
                              {record.description || 'No description'}
                            </TableCell>
                            <TableCell className="text-center">
                              {/* Documents Column */}
                              {record.documents && record.documents.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {record.documents.length} file{record.documents.length > 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">No docs</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                {/* Audio Controls */}
                                {(record.audioRecording || (record.audioFiles && record.audioFiles.length > 0)) && (
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const audioUrl = record.audioRecording?.url || 
                                                       (record.audioFiles && record.audioFiles.length > 0 ? URL.createObjectURL(record.audioFiles[0]) : '');
                                        if (audioUrl) playAudio(audioUrl, record.id);
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
                                        const audioUrl = record.audioRecording?.url || 
                                                       (record.audioFiles && record.audioFiles.length > 0 ? URL.createObjectURL(record.audioFiles[0]) : '');
                                        if (audioUrl) downloadAudio(audioUrl, `${record.patientName}-audio`);
                                      }}
                                      title="Download Audio"
                                    >
                                      <Download className="w-4 h-4 text-green-600" />
                                    </Button>
                                  </div>
                                )}
                                
                                {/* Document Controls */}
                                {record.documents.length > 0 && (
                                  <div className="flex space-x-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {record.documents.length} files
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        // Download all documents for this record - handle both legacy and new files
                                        record.documents.forEach((doc, index) => {
                                          if (doc.filePath) {
                                            // New server-side file
                                            const fileUrl = getFileUrl(doc.filePath);
                                            const a = document.createElement('a');
                                            a.href = fileUrl;
                                            a.download = doc.name;
                                            a.target = '_blank';
                                            a.click();
                                          } else if (doc.data) {
                                            // Legacy base64 data
                                            const byteCharacters = atob(doc.data);
                                            const byteNumbers = new Array(byteCharacters.length);
                                            for (let i = 0; i < byteCharacters.length; i++) {
                                              byteNumbers[i] = byteCharacters.charCodeAt(i);
                                            }
                                            const byteArray = new Uint8Array(byteNumbers);
                                            const blob = new Blob([byteArray], { type: doc.type });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = doc.name;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                          } else {
                                            console.warn('Document data not available for download:', doc.name);
                                          }
                                        });
                                      }}
                                      title="Download All Documents"
                                    >
                                      <File className="w-4 h-4 text-purple-600" />
                                    </Button>
                                  </div>
                                )}
                                
                                {/* View Documents Control */}
                                {record.documents && record.documents.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      try {
                                        // Open the first document in a new tab
                                        const firstDoc = record.documents[0];
                                        if (firstDoc && firstDoc.filePath) {
                                          const fileUrl = getFileUrl(firstDoc.filePath);
                                          window.open(fileUrl, '_blank');
                                        } else if (firstDoc && firstDoc.data) {
                                          // Legacy base64 data
                                          const byteCharacters = atob(firstDoc.data);
                                          const byteNumbers = new Array(byteCharacters.length);
                                          for (let i = 0; i < byteCharacters.length; i++) {
                                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                                          }
                                          const byteArray = new Uint8Array(byteNumbers);
                                          const blob = new Blob([byteArray], { type: firstDoc.type || 'application/octet-stream' });
                                          const url = URL.createObjectURL(blob);
                                          window.open(url, '_blank');
                                          // Clean up after a delay
                                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                                        }
                                      } catch (error) {
                                        console.error('Error opening document:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to open document",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    title="View Document"
                                    className="bg-green-100 hover:bg-green-200 text-green-600 border-green-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                {/* Delete Control */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteFromViewPopup(record)}
                                  title="Delete Medical Record"
                                  className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      
                      {/* Show message if no medical records exist */}
                      {viewedPatientMedicalRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center space-y-2">
                              <FileText className="w-8 h-8 text-muted-foreground/50" />
                              <p>No medical records found for this patient</p>
                              <p className="text-sm">Medical records will appear here when added</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Audio Section */}
              {viewRecord.audioRecording && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Audio Recording</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="space-y-4">
                      {/* Audio File Info */}
                      <div className="flex items-center space-x-3 p-3 bg-background rounded border">
                        <div className="p-2 bg-blue-100 rounded">
                          <Volume2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{viewRecord.audioRecording.fileName || 'Audio Recording'}</p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {formatDuration(viewRecord.audioRecording.duration)} • Audio File
                          </p>
                        </div>
                      </div>

                      {/* Audio Controls */}
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (viewRecord.audioRecording?.url) {
                              playAudio(viewRecord.audioRecording.url, viewRecord.id);
                            }
                          }}
                          className="flex items-center space-x-2"
                        >
                          {playingAudio === viewRecord.id ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>Play</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (viewRecord.audioRecording?.url) {
                              downloadAudio(viewRecord.audioRecording.url, `${viewRecord.patientName}-${viewRecord.audioRecording.fileName || 'audio.wav'}`);
                            }
                          }}
                          className="flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Cycle through speed options: 0.5x, 1x, 1.25x, 1.5x, 2x
                            const speeds = [0.5, 1, 1.25, 1.5, 2];
                            const currentIndex = speeds.indexOf(playbackSpeed);
                            const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                            setPlaybackSpeed(nextSpeed);
                            // Update current audio if playing
                            if (audioRef.current && playingAudio === viewRecord.id) {
                              audioRef.current.playbackRate = nextSpeed;
                            }
                          }}
                          className="flex items-center space-x-2"
                          title={`Playback Speed: ${playbackSpeed}x`}
                        >
                          <span className="text-sm font-mono">{playbackSpeed}x</span>
                        </Button>
                        {viewRecord.audioRecording && (
                          <span className="text-sm text-muted-foreground">
                            Duration: {formatDuration(viewRecord.audioRecording.duration)}
                          </span>
                        )}
                      </div>

                      {/* Playback Speed Controls */}
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium text-muted-foreground">Speed:</Label>
                        <div className="flex space-x-1">
                          {[1, 1.25, 1.5, 2, 2.5, 3].map(speed => (
                            <Button
                              key={speed}
                              variant={playbackSpeed === speed ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePlaybackSpeed(speed)}
                              className={`px-3 py-1 text-xs ${
                                playbackSpeed === speed 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {speed}x
                            </Button>
                          ))}
                        </div>
                        {playingAudio === viewRecord.id && (
                          <span className="text-xs text-muted-foreground ml-2">
                            Playing at {playbackSpeed}x speed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Documents Section */}
              {viewRecord.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Documents & Photos</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    
                    {/* Photos Section */}
                    {viewRecord.documents.filter(doc => doc.type?.startsWith('image/')).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium mb-3 text-muted-foreground">Photos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {viewRecord.documents.filter(doc => doc.type?.startsWith('image/')).map((photo, index) => (
                            <div key={`photo-${index}`} className="relative group">
                              <div 
                                className="w-full h-24 bg-gray-100 rounded border cursor-pointer overflow-hidden"
                                onClick={() => {
                                  // Open photo in new tab
                                  if (photo.filePath) {
                                    const fileUrl = getFileUrl(photo.filePath);
                                    window.open(fileUrl, '_blank');
                                  }
                                }}
                              >
                                {photo.filePath ? (
                                  <img 
                                    src={getFileUrl(photo.filePath)}
                                    alt={photo.name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <File className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all duration-200 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs text-center mt-1 text-muted-foreground truncate">{photo.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents Section */}
                    {viewRecord.documents.filter(doc => !doc.type?.startsWith('image/')).length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-3 text-muted-foreground">Documents</h4>
                        <div className="grid gap-3">
                          {viewRecord.documents.filter(doc => !doc.type?.startsWith('image/')).map((doc, index) => (
                            <div key={`doc-${index}`} className="flex items-center justify-between p-3 bg-background rounded border">
                              <div className="flex items-center space-x-3">
                                <File className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <span className="text-sm font-medium">{doc.name}</span>
                                  <p className="text-xs text-muted-foreground">
                                    {(doc.size / 1024).toFixed(1)} KB • {doc.type}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Handle both legacy base64 and new server-side files
                                  if (doc.filePath) {
                                    // New server-side file
                                    const fileUrl = getFileUrl(doc.filePath);
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = doc.name;
                                    a.target = '_blank';
                                    a.click();
                                  } else if (doc.data) {
                                    // Legacy base64 data
                                    const byteCharacters = atob(doc.data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: doc.type });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = doc.name;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  } else {
                                    // Fallback for old records without data
                                    console.warn('Document data not available for download:', doc.name);
                                    alert('This document cannot be downloaded as it was uploaded before file storage was implemented.');
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-700"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setViewRecord(null);
                  // Reset view dialog filters when closing
                  setViewDialogFilterMonth(null);
                  setViewDialogFilterYear(null);
                  setViewDialogSelectedMonth(new Date().getMonth());
                  setViewDialogSelectedYear(currentYear);
                }} 
                className="global-btn global-btn-secondary w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog Month/Year Picker Dialog */}
      <Dialog open={showViewDialogMonthYearDialog} onOpenChange={setShowViewDialogMonthYearDialog}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Select Month & Year for Medical History</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex gap-2">
              <select
                className="border rounded px-3 py-2 flex-1"
                value={viewDialogSelectedMonth}
                onChange={e => setViewDialogSelectedMonth(Number(e.target.value))}
              >
                {months.map((month, idx) => (
                  <option key={month} value={idx}>{month}</option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-2 flex-1"
                value={viewDialogSelectedYear}
                onChange={e => setViewDialogSelectedYear(Number(e.target.value))}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={currentYear - 5 + i} value={currentYear - 5 + i}>{currentYear - 5 + i}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => {
                  setViewDialogFilterMonth(viewDialogSelectedMonth);
                  setViewDialogFilterYear(viewDialogSelectedYear);
                  setShowViewDialogMonthYearDialog(false);
                }}
                className="global-btn global-btn-primary"
              >
                Apply Filter
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowViewDialogMonthYearDialog(false)}
                className="global-btn global-btn-secondary"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setViewDialogFilterMonth(null);
                  setViewDialogFilterYear(null);
                  setShowViewDialogMonthYearDialog(false);
                }}
                className="global-btn global-btn-secondary"
              >
                Clear Filter
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Centered */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-destructive">Delete Medical Record</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this medical record?
              <br />
              <strong>{deleteRecord?.title}</strong>
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              className="global-btn global-btn-secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              className="global-btn global-btn-danger"
            >
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Month/Year Picker Dialog */}
      <Dialog open={showMonthYearDialog} onOpenChange={setShowMonthYearDialog}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Select Month & Year</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex gap-2">
              <select
                className="border rounded px-3 py-2 flex-1"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((month, idx) => (
                  <option key={month} value={idx}>{month}</option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-2 flex-1"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={currentYear - 5 + i} value={currentYear - 5 + i}>{currentYear - 5 + i}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => {
                  setFilterMonth(selectedMonth);
                  setFilterYear(selectedYear);
                  setShowMonthYearDialog(false);
                }}
                className="global-btn global-btn-primary"
              >
                Apply Filter
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowMonthYearDialog(false)}
                className="global-btn global-btn-secondary"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setFilterMonth(null);
                  setFilterYear(null);
                  setShowMonthYearDialog(false);
                }}
                className="global-btn global-btn-secondary"
              >
                Clear Filter
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientHistory;