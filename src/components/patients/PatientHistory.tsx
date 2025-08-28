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
  Users,
  Activity,
  X,
  RefreshCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { DatabaseService } from '@/services/databaseService';
import { getFileUrl, uploadMedicalHistoryFile } from '@/services/simpleFileUpload';
import { PatientPhoto } from '@/utils/photoUtils';
import { ActionButtons } from '@/components/ui/HeaderActionButtons';
import MonthYearPickerDialog from '@/components/shared/MonthYearPickerDialog';
import usePageTitle from '@/hooks/usePageTitle';

interface DocumentWithData {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  data?: string; // Base64 data (legacy)
  filePath?: string; // Server file path (new)
}

interface AudioFileWithData {
  name: string;
  size?: number;
  type: string;
  filePath?: string; // Server file path (new)
  lastModified?: number;
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
  audioFiles: (File | AudioFileWithData)[]; // Can be either File objects or metadata objects
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
  // Set page title
  usePageTitle();

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
  const [refreshKey, setRefreshKey] = useState(0); // For main page refresh
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
  const currentMonth = new Date().getMonth() + 1; // 1-based for August = 8
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isMonthYearDialogOpen, setIsMonthYearDialogOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(currentMonth);
  const [filterYear, setFilterYear] = useState<number | null>(currentYear);
  
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

  // State for new medical record form
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    doctor: '',
    recordType: '',
    category: '',
    description: '',
    audioFiles: [] as File[]
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Month and year state for view dialog filtering
  const [viewDialogSelectedMonth, setViewDialogSelectedMonth] = useState(currentMonth); // 1-based
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
  }, [refreshKey]);

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
        audioFiles: (() => {
          // Start with legacy audio files
          const audioFiles: any[] = [];
          
          // Add legacy audio file if exists
          if (record.audio_file_name) {
            audioFiles.push({ 
              name: record.audio_file_name,
              filePath: record.audio_recording, // Use the audio_recording field as the file path
              type: 'audio/wav' // Default to wav for legacy files
            });
          }
          
          // Parse documents_info to find additional audio files
          if (record.documents_info) {
            try {
              let jsonString = record.documents_info;
              
              // Handle invalid cases
              if (jsonString === "0" || jsonString === "" || jsonString === "null") {
                return audioFiles;
              }
              
              // Handle double-encoded JSON
              if (typeof jsonString === 'string' && jsonString.startsWith('"') && jsonString.endsWith('"')) {
                jsonString = jsonString.slice(1, -1);
                jsonString = jsonString.replace(/\\"/g, '"');
              }
              
              const parsed = JSON.parse(jsonString);
              
              if (Array.isArray(parsed)) {
                const parsedAudioFiles = parsed.filter(item => item && item.name && item.type?.startsWith('audio/'));
                // Add filePath information to audio files from documents_info
                parsedAudioFiles.forEach(audioFile => {
                  if (audioFile.filePath && !audioFile.filePath.startsWith('http')) {
                    // Ensure the filePath is correctly formatted for the server
                    audioFile.filePath = audioFile.filePath;
                  }
                });
                audioFiles.push(...parsedAudioFiles);
              } else if (parsed && parsed.name && parsed.type?.startsWith('audio/')) {
                if (parsed.filePath && !parsed.filePath.startsWith('http')) {
                  // Ensure the filePath is correctly formatted for the server
                  parsed.filePath = parsed.filePath;
                }
                audioFiles.push(parsed);
              }
            } catch (error) {
              console.error('Error parsing documents_info for audio files:', error);
            }
          }
          
          console.log(`🎵 Audio files for record ${record.id}:`, audioFiles);
          return audioFiles;
        })(),
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
              // Return only non-audio documents
              const documentFiles = parsed.filter(item => item && item.name && !item.type?.startsWith('audio/'));
              console.log(`📋 Document files found:`, documentFiles.length, documentFiles);
              return documentFiles;
            } else if (parsed && parsed.name && !parsed.type?.startsWith('audio/')) {
              console.log(`📋 Single non-audio document found:`, parsed);
              return [parsed];
            }
            
            return [];
          } catch (error) {
            console.error('❌ Error parsing documents_info for documents:', error);
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

  // Function to load all data - matches PatientMedicalRecord implementation
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
        return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
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
      audioFiles: (record.audioFiles || []) as File[], // Cast to File[] for form state
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

  // Handlers for new medical record form
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.date || !newRecord.recordType.trim() || !viewRecord) return;

    setSubmitting(true);
    try {
      // Generate a unique ID for the new record
      const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let filePaths: string[] = [];
      
      // Upload files if any (including regular files and audio files)
      const allFiles = [...selectedFiles, ...newRecord.audioFiles];
      if (allFiles.length > 0) {
        for (const file of allFiles) {
          try {
            const fileType = file.type.startsWith('audio/') ? 'audio' : 'document';
            const filePath = await uploadMedicalHistoryFile(file, viewRecord.patientId, fileType);
            filePaths.push(filePath);
          } catch (error) {
            console.error('File upload failed:', error);
          }
        }
      }

      // Create documents info
      const documentsInfo = allFiles.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        filePath: filePaths[index] || null
      }));

      // Create the record
      const dbRecord = {
        id: recordId,
        patient_id: viewRecord.patientId,
        patient_name: viewRecord.patientName,
        date: newRecord.date,
        title: newRecord.recordType,
        doctor: newRecord.doctor || 'System',
        category: 'General',
        description: newRecord.description,
        documents_info: documentsInfo.length > 0 ? JSON.stringify(documentsInfo) : null
      };

      await DatabaseService.addPatientHistory(dbRecord);
      
      toast({
        title: "Record Added",
        description: "Medical record has been added successfully.",
      });

      // Reset form
      setNewRecord({
        date: new Date().toISOString().split('T')[0],
        doctor: '',
        recordType: '',
        category: '',
        description: '',
        audioFiles: []
      });
      setSelectedFiles([]);
      setAudioRecording(null);
      setRecordingTime(0);
      
      // Refresh the view
      setRefreshCounter(prev => prev + 1);
      
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add medical record.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        const recordMonth = recordDate.getMonth() + 1; // Convert to 1-12
        const recordYear = recordDate.getFullYear();
        return recordMonth === filterMonth && recordYear === filterYear;
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
        return recordDate.getMonth() + 1 === viewDialogFilterMonth && recordDate.getFullYear() === viewDialogFilterYear;
      });
    }
    
    return records;
  }, [medicalRecords, viewRecord?.patientId, refreshCounter, viewDialogFilterMonth, viewDialogFilterYear]);

    return (
      <div className="crm-page-bg">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="crm-header-container">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="crm-header-icon">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Patient History</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
              <ActionButtons.Refresh onClick={() => {
                console.log('🔄 Manual refresh triggered - refreshing entire page');
                window.location.reload();
              }} />
              
              <ActionButtons.MonthYear
                text={`${months[selectedMonth - 1]} ${selectedYear}`}
                onClick={() => setIsMonthYearDialogOpen(true)}
              />
              
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
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                    {(() => {
                      // Filter active patients based on medical records that match the month/year filter
                      let activePatientIds = new Set();
                      let filteredMedicalRecords = medicalRecords;
                      
                      // Apply month & year filtering
                      if (filterMonth !== null && filterYear !== null) {
                        filteredMedicalRecords = filteredMedicalRecords.filter(record => {
                          const recordDate = new Date(record.date);
                          return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
                        });
                      }
                      
                      // Get unique patient IDs from filtered medical records
                      filteredMedicalRecords.forEach(record => {
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
                          return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
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
                          return recordDate.getMonth() + 1 === filterMonth && recordDate.getFullYear() === filterYear;
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
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search records..."
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
                          
                          return patient?.photo ? (
                            <PatientPhoto 
                              key={`${record.patientId}-${patient.photo}`}
                              photoPath={patient.photo} 
                              alt={record.patientName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
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
                                  return medicalPatientId === currentPatientId && (medicalRecord.audioRecording || (medicalRecord.audioFiles && medicalRecord.audioFiles.length > 0));
                                });
                                
                                if (firstAudioRecord?.audioRecording) {
                                  // Handle legacy audio recording
                                  playAudio(firstAudioRecord.audioRecording.url, firstAudioRecord.id);
                                } else if (firstAudioRecord?.audioFiles && firstAudioRecord.audioFiles.length > 0) {
                                  // Handle new audio files - try to play the first one
                                  const firstAudioFile = firstAudioRecord.audioFiles[0];
                                  if (firstAudioFile && (firstAudioFile as any).filePath) {
                                    const audioUrl = getFileUrl((firstAudioFile as any).filePath);
                                    playAudio(audioUrl, firstAudioRecord.id);
                                  } else {
                                    toast({
                                      title: "Audio Not Available",
                                      description: "Audio file path not found.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              className="action-btn-count action-btn-primary"
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
                            className="action-btn-count action-btn-secondary"
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
                          // For basic patient records, show add history option - REMOVED EDIT BUTTON
                          null
                        ) : (
                          // For actual medical records, show edit option - REMOVED EDIT BUTTON
                          null
                        )}
                        {!record.id.startsWith('patient_') && (
                          // Only show delete for actual medical records, not basic patient entries
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0 pb-4 border-b border-gray-200">
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <Edit2 className="w-6 h-6" />
              <span>{editRecord ? 'Edit Medical Record' : 'Add Medical Record'}</span>
            </DialogTitle>
            <DialogDescription>
              {editRecord ? 'Update patient medical record' : 'Create a new patient medical record'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
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

            {/* Audio Upload Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-blue-600" />
                Upload Audio Files <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <Input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleAudioFileUpload(e.target.files)}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground mb-2">
                  Select multiple audio files (MP3, WAV, etc.) - up to 500MB each
                </p>
                {formData.audioFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-700">Uploaded Audio Files ({formData.audioFiles.length}):</Label>
                    {formData.audioFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedFiles = formData.audioFiles.filter((_, i) => i !== index);
                            setFormData({...formData, audioFiles: updatedFiles});
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-2 py-1"
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
                        className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
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
          
          <DialogFooter className="shrink-0 border-t-2 border-gray-300 pt-6 bg-gradient-to-r from-gray-50 to-white shadow-xl sticky bottom-0 z-10 flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                resetForm(); // Reset form when canceling
              }}
              className="px-6 py-3 text-base font-medium border-2 border-gray-300 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !newRecord.date || !newRecord.doctor.trim() || !newRecord.recordType.trim()}
              className="px-8 py-3 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editRecord ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  {editRecord ? 'Update Medical Record' : 'Add Medical Record'}
                </>
              )}
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
            className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Glass Morphism Style */}
            <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
                <div className="relative flex-shrink-0">
                  {(() => {
                    const patient = patients.find(p => String(p.id) === String(viewRecord.patientId));
                    
                    return patient?.photo ? (
                      <PatientPhoto 
                        key={`${viewRecord.patientId}-${patient.photo}`}
                        photoPath={patient.photo} 
                        alt={viewRecord.patientName}
                        className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 border-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl">
                            {(viewRecord.patientName || 'P').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Medical History Details</span>
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
            
            {/* Main content with scrolling enabled */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" style={{scrollbarWidth: 'thin', scrollbarColor: '#60a5fa #dbeafe'}}>
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
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{formatPatientId(viewRecord.patientId)}</p>
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
                </div>
              </div>

              {/* Add New Medical Record Form Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
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

                    {/* Doctor Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="add-record-doctor" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        Doctor <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="add-record-doctor"
                        value={newRecord.doctor}
                        onChange={(e) => setNewRecord({ ...newRecord, doctor: e.target.value })}
                        className="w-full bg-white/90 backdrop-blur-sm border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300 px-3 py-2 rounded-md text-sm"
                        required
                      >
                        <option value="">Select doctor</option>
                        <option value="Sabarish 2 (DOC002)">Sabarish 2 (DOC002)</option>
                        <option value="Sabarish 1 (DOC001)">Sabarish 1 (DOC001)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

                    {/* Category Field */}
                    <div className="space-y-2">
                      <Label htmlFor="add-record-category" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Category
                      </Label>
                      <Input
                        id="add-record-category"
                        type="text"
                        value={newRecord.category}
                        onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
                        className="w-full bg-white/90 backdrop-blur-sm border-orange-200 focus:border-orange-400 focus:ring-orange-300"
                        placeholder="Enter category (e.g., Consultation, Prescription, Lab Report)"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="add-record-description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Description
                    </Label>
                    <Textarea
                      id="add-record-description"
                      value={newRecord.description}
                      onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                      className="w-full bg-white/90 backdrop-blur-sm border border-orange-200 focus:border-orange-400 focus:ring-orange-300 min-h-[100px] resize-y"
                      placeholder="Enter detailed description of the medical record..."
                    />
                  </div>

                  {/* Audio Upload Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-blue-600" />
                      Upload Audio Files <span className="text-gray-500">(Optional)</span>
                    </Label>
                    <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <Input
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setNewRecord({...newRecord, audioFiles: [...newRecord.audioFiles, ...files]});
                        }}
                        className="mb-2 bg-white/80 border-blue-200 focus:border-blue-400 focus:ring-blue-300"
                      />
                      <p className="text-xs text-gray-500 mb-2">
                        Select multiple audio files (MP3, WAV, etc.) - up to 500MB each
                      </p>
                      {newRecord.audioFiles?.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-blue-700">Uploaded Audio Files ({newRecord.audioFiles.length}):</Label>
                          {newRecord.audioFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                              <div className="flex items-center space-x-2">
                                <Volume2 className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updatedFiles = newRecord.audioFiles?.filter((_, i) => i !== index) || [];
                                  setNewRecord({...newRecord, audioFiles: updatedFiles});
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-indigo-400 focus:ring-indigo-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can select multiple files including images, audio recordings, and documents
                      </p>
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                          {selectedFiles.map((file, index) => (
                            <p key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button for Medical Record Form */}
                  <div className="flex justify-end pt-6 pb-2 border-t border-gray-200 mt-6">
                    <Button
                      type="submit"
                      disabled={submitting || !newRecord.date || !newRecord.doctor.trim() || !newRecord.recordType.trim()}
                      className="px-8 py-3 text-base font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Adding Record...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          Add Medical Record
                        </>
                      )}
                    </Button>
                  </div>

                </form>
              </div>

              {/* Medical History Section with Beautiful Design */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    Medical History Records
                  </h3>
                </div>

                {/* Medical Records Table with Glass Morphism */}
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500">
                        <TableHead className="text-center font-bold text-white">S NO</TableHead>
                        <TableHead className="text-center font-bold text-white">Date</TableHead>
                        <TableHead className="text-center font-bold text-white">Doctor</TableHead>
                        <TableHead className="text-center font-bold text-white">Description</TableHead>
                        <TableHead className="text-center font-bold text-white">Documents</TableHead>
                        <TableHead className="text-center font-bold text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Get all medical records for this patient */}
                      {viewedPatientMedicalRecords.map((record, index) => (
                          <TableRow key={record.id} className="hover:bg-blue-50/50 backdrop-blur-sm transition-all duration-200 border-b border-gray-100">
                            <TableCell className="text-center font-medium text-gray-700">{index + 1}</TableCell>
                            <TableCell className="text-center text-gray-700">{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-center text-gray-700">{record.doctor}</TableCell>
                            <TableCell className="text-center max-w-xs truncate text-gray-700" title={record.description}>
                              {record.description || 'No description'}
                            </TableCell>
                            <TableCell className="text-center">
                              {/* Documents Column */}
                              {record.documents && record.documents.length > 0 ? (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                  {record.documents.length} file{record.documents.length > 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">No docs</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-1 sm:space-x-2">
                                {/* Audio Controls */}
                                {(record.audioRecording || (record.audioFiles && record.audioFiles.length > 0)) && (
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        let audioUrl = '';
                                        
                                        // Priority 1: Use audioRecording.url if available (server-side audio files)
                                        if (record.audioRecording?.url) {
                                          audioUrl = record.audioRecording.url;
                                          console.log('🎵 Using audioRecording URL:', audioUrl);
                                        }
                                        // Priority 2: Try to construct URL from audioFiles metadata (for server-side files)
                                        else if (record.audioFiles && record.audioFiles.length > 0) {
                                          const audioFile = record.audioFiles[0];
                                          
                                          // Type guard: Check if it's an AudioFileWithData object
                                          if ('filePath' in audioFile && audioFile.filePath) {
                                            audioUrl = getFileUrl(audioFile.filePath);
                                            console.log('🎵 Using audioFile filePath:', audioFile.filePath, '-> URL:', audioUrl);
                                          }
                                          // If it's an actual File object, create blob URL
                                          else if (audioFile instanceof File) {
                                            audioUrl = URL.createObjectURL(audioFile as File);
                                            console.log('🎵 Created blob URL from File object:', audioUrl);
                                          }
                                          // If it has name property, try to construct server path
                                          else if ('name' in audioFile && audioFile.name) {
                                            // Assume server-side file in uploads directory
                                            audioUrl = getFileUrl(`uploads/medical-history-audio/${audioFile.name}`);
                                            console.log('🎵 Constructed server URL from name:', audioFile.name, '-> URL:', audioUrl);
                                          }
                                        }
                                        
                                        if (audioUrl) {
                                          console.log('🎵 Final audio URL for playback:', audioUrl);
                                          playAudio(audioUrl, record.id);
                                        } else {
                                          console.error('❌ No valid audio URL found for record:', record.id);
                                          toast({
                                            title: "Audio Not Found",
                                            description: "No valid audio file found for this record.",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      title="Play Audio"
                                      className="action-btn-lead bg-green-50 hover:bg-green-100 text-green-600 border border-green-200"
                                    >
                                      {playingAudio === record.id ? (
                                        <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                                      ) : (
                                        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        let audioUrl = '';
                                        
                                        // Priority 1: Use audioRecording.url if available
                                        if (record.audioRecording?.url) {
                                          audioUrl = record.audioRecording.url;
                                        }
                                        // Priority 2: Try to construct URL from audioFiles metadata
                                        else if (record.audioFiles && record.audioFiles.length > 0) {
                                          const audioFile = record.audioFiles[0];
                                          
                                          // Type guard: Check if it's an AudioFileWithData object
                                          if ('filePath' in audioFile && audioFile.filePath) {
                                            audioUrl = getFileUrl(audioFile.filePath);
                                          } 
                                          // If it's an actual File object, create blob URL
                                          else if (audioFile instanceof File) {
                                            audioUrl = URL.createObjectURL(audioFile as File);
                                          } 
                                          // If it has name property, try to construct server path
                                          else if ('name' in audioFile && audioFile.name) {
                                            audioUrl = getFileUrl(`uploads/medical-history-audio/${audioFile.name}`);
                                          }
                                        }
                                        
                                        if (audioUrl) {
                                          downloadAudio(audioUrl, `${record.patientName}-audio`);
                                        }
                                      }}
                                      title="Download Audio"
                                      className="action-btn-lead bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
                                    >
                                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </div>
                                )}
                                
                                {/* Document Controls */}
                                {record.documents.length > 0 && (
                                  <div className="flex space-x-1">
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
                                      className="action-btn-lead bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200"
                                    >
                                      <File className="w-3 h-3 sm:w-4 sm:h-4" />
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
                                    className="action-btn-lead action-btn-view"
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                )}
                                
                                {/* Delete Control */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteFromViewPopup(record)}
                                  title="Delete Medical Record"
                                  className="action-btn-lead action-btn-delete h-8 w-8 sm:h-9 sm:w-9 p-0"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      
                      {/* Show message if no medical records exist */}
                      {viewedPatientMedicalRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">No medical records found</p>
                                <p className="text-xs text-gray-500 mt-1">Medical records will appear here when added</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Audio Section with Beautiful Design */}
              {viewRecord.audioRecording && (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Audio Recording
                  </h3>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 rounded-lg border border-blue-200">
                    {/* Audio File Info Card */}
                    <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-blue-200 mb-4 sm:mb-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{viewRecord.audioRecording.fileName || 'Audio Recording'}</p>
                          <p className="text-xs sm:text-sm text-blue-600">
                            Duration: {formatDuration(viewRecord.audioRecording.duration)} • Audio File
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (viewRecord.audioRecording?.url) {
                            playAudio(viewRecord.audioRecording.url, viewRecord.id);
                          }
                        }}
                        className="bg-white/90 backdrop-blur-sm border-blue-200 hover:bg-blue-50 flex items-center gap-2"
                      >
                        {playingAudio === viewRecord.id ? (
                          <>
                            <Pause className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600 font-medium">Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Play</span>
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
                        className="bg-blue-50/90 backdrop-blur-sm border-blue-200 hover:bg-blue-100 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">Download</span>
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
                        className="bg-white/90 backdrop-blur-sm border-purple-200 hover:bg-purple-50 flex items-center gap-2"
                        title={`Playback Speed: ${playbackSpeed}x`}
                      >
                        <span className="text-sm font-mono text-purple-600 font-bold">{playbackSpeed}x</span>
                      </Button>
                      
                      {viewRecord.audioRecording && (
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600 font-medium">
                            Duration: {formatDuration(viewRecord.audioRecording.duration)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Playback Speed Controls */}
                    <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-purple-600" />
                          Playback Speed:
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 1.25, 1.5, 2, 2.5, 3].map(speed => (
                          <Button
                            key={speed}
                            variant={playbackSpeed === speed ? "default" : "outline"}
                            size="sm"
                            onClick={() => changePlaybackSpeed(speed)}
                            className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                              playbackSpeed === speed 
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md transform scale-105' 
                                : 'bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {speed}x
                          </Button>
                        ))}
                      </div>
                      {playingAudio === viewRecord.id && (
                        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            Playing at {playbackSpeed}x speed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Documents Section with Beautiful Design */}
              {viewRecord.documents.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-green-100 shadow-sm">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <File className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    Documents & Media Files
                  </h3>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-3 sm:p-4 md:p-6 rounded-lg border border-green-200">
                    
                    {/* Photos Section */}
                    {viewRecord.documents.filter(doc => doc.type?.startsWith('image/')).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-600" />
                          Photo Gallery
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                          {viewRecord.documents.filter(doc => doc.type?.startsWith('image/')).map((photo, index) => (
                            <div key={`photo-${index}`} className="relative group">
                              <div 
                                className="w-full h-20 sm:h-24 md:h-28 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-blue-200 cursor-pointer overflow-hidden hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
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
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <File className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-all duration-300 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                              <p className="text-xs text-center mt-2 text-gray-600 font-medium truncate">{photo.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents Section */}
                    {viewRecord.documents.filter(doc => !doc.type?.startsWith('image/')).length > 0 && (
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Document Files
                        </h4>
                        <div className="grid gap-3 sm:gap-4">
                          {viewRecord.documents.filter(doc => !doc.type?.startsWith('image/')).map((doc, index) => (
                            <div key={`doc-${index}`} className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <File className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                                    <p className="text-xs text-purple-600">
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
                                  className="action-btn-lead bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
                                  title="Download Document"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      )}

      {/* View Dialog Month/Year Picker Dialog with Beautiful Design */}
      <Dialog open={showViewDialogMonthYearDialog} onOpenChange={setShowViewDialogMonthYearDialog}>
        <DialogContent className="sm:max-w-[400px] bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-xl border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 p-4 -mt-6 -mx-6 mb-4 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-white font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Month & Year
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Choose the time period for medical history records
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex flex-col gap-4 py-2">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Month</Label>
                <select
                  className="w-full bg-white/90 backdrop-blur-sm border border-blue-200 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                  value={viewDialogSelectedMonth}
                  onChange={e => setViewDialogSelectedMonth(Number(e.target.value))}
                >
                  {months.map((month, idx) => (
                    <option key={month} value={idx}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Year</Label>
                <select
                  className="w-full bg-white/90 backdrop-blur-sm border border-purple-200 rounded-lg px-3 py-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-300 transition-all"
                  value={viewDialogSelectedYear}
                  onChange={e => setViewDialogSelectedYear(Number(e.target.value))}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={currentYear - 5 + i} value={currentYear - 5 + i}>{currentYear - 5 + i}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <DialogFooter className="flex gap-2 pt-4">
              <Button 
                type="button" 
                onClick={() => {
                  setViewDialogFilterMonth(viewDialogSelectedMonth);
                  setViewDialogFilterYear(viewDialogSelectedYear);
                  setShowViewDialogMonthYearDialog(false);
                }}
                className="action-btn-lead action-btn-primary"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowViewDialogMonthYearDialog(false)}
                variant="outline"
                className="flex-1 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
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
                className="flex-1 bg-white/90 backdrop-blur-sm border-red-200 hover:bg-red-50 text-red-600"
              >
                Clear Filter
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{deleteRecord.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteRecord.patientName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteRecord.date || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{deleteRecord.category || 'Medical Record'}</span>
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
        description="Filter patient history records by specific month and year"
        previewText="history records"
      />
      
      </div>
    </div>
  );
};

export default PatientHistory;