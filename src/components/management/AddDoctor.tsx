// Removed duplicate React import
// ...existing code...
// This will be the Add Doctor popup/page, matching AddStaff but for doctors.
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Upload, Stethoscope, Phone, Mail, MapPin, FileText, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { DatabaseService } from '@/services/databaseService';
import { uploadDoctorFile, uploadMultipleDoctorFiles, preGenerateDoctorId } from '@/services/doctorFileUpload';
import usePageTitle from '@/hooks/usePageTitle';
import '../../styles/selective-header-buttons-new.css';

const AddDoctor: React.FC = () => {
  // Set page title
  usePageTitle();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joinDate, setJoinDate] = useState<Date>();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preGeneratedDoctorId, setPreGeneratedDoctorId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    department: '',
    salary: '',
    status: 'Active',
  });
  const [specializations, setSpecializations] = useState<any[]>([]);

  useEffect(() => {
    loadSpecializations();
    // Get the next sequential doctor ID for consistent uploads
    getNextDoctorId();
  }, []);

  // Get next sequential doctor ID from backend
  const getNextDoctorId = async () => {
    try {
      const response = await fetch('/api/doctors/next-id');
      if (!response.ok) {
        throw new Error('Failed to get next doctor ID');
      }
      const data = await response.json();
      const doctorId = data.nextId;
      setPreGeneratedDoctorId(doctorId);
      console.log('🆔 Got sequential doctor ID for uploads:', doctorId);
    } catch (error) {
      console.error('Error getting next doctor ID:', error);
      // Fallback to timestamp-based ID if sequential fails
      const fallbackId = preGenerateDoctorId();
      setPreGeneratedDoctorId(fallbackId);
      console.log('🆔 Using fallback ID:', fallbackId);
    }
  };

  // Test function to fill form with sample data
  const fillTestData = () => {
    setFormData({
      name: 'Dr. Test Doctor',
      email: 'test.doctor@hospital.com',
      phone: '9876543210',
      address: '123 Medical Center, Hospital Street, City, State, 12345',
      specialization: 'General Medicine',
      department: 'General',
      salary: '75000',
      status: 'Active',
    });
    setJoinDate(new Date());
  };

  // Test API connection
  const testConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/doctors`);
      const data = await response.json();
      console.log('API connection test successful:', data);
      toast({
        title: 'Connection Test',
        description: `API is working! Found ${Array.isArray(data) ? data.length : 0} doctors in database.`,
      });
    } catch (error) {
      console.error('API connection test failed:', error);
      toast({
        title: 'Connection Error',
        description: `API connection failed: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const loadSpecializations = async () => {
    try {
      const data = await DatabaseService.getAllDoctorCategories();
      const activeSpecializations = data.filter((cat: any) => cat.status === 'active') || [];
      setSpecializations(activeSpecializations);
      
      // If no specializations exist, create some default ones
      if (activeSpecializations.length === 0) {
        console.log('No specializations found, user can still add doctor with manual specialization');
        // Don't block the form, just log this
      }
    } catch (error) {
      console.error('Error loading specializations:', error);
      // Don't show error toast, just log it and continue
      // User can still enter specialization manually
    }
  };
  const [documents, setDocuments] = useState({
    aadharFront: null as File | null,
    aadharBack: null as File | null,
    panFront: null as File | null,
    panBack: null as File | null,
  });

  // Store actual uploaded file paths
  const [uploadedFilePaths, setUploadedFilePaths] = useState({
    photo: '',
    aadharFront: '',
    aadharBack: '',
    panFront: '',
    panBack: '',
  });
  // File size validation function (matches AddPatient)
  const validateFileSize = (file: File | null): boolean => {
    if (!file) return true;
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

  // Handle photo upload with validation and file upload service
  const handlePhotoUpload = async (file: File | null) => {
    if (!validateFileSize(file)) {
      return; // Don't update state if file is too large
    }
    
    if (!file) {
      setPhoto(null);
      // Clear the uploaded photo path when photo is removed
      setUploadedFilePaths(prev => ({
        ...prev,
        photo: ''
      }));
      return;
    }

    // Ensure we have a doctor ID for upload
    if (!preGeneratedDoctorId) {
      toast({
        title: "Upload Error",
        description: "Doctor ID not generated yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📤 Starting photo upload for doctor ID:', preGeneratedDoctorId);
      
      // Upload photo immediately using the file upload service
      const photoPath = await uploadDoctorFile(file, preGeneratedDoctorId, 'photo');
      
      console.log('✅ Photo uploaded successfully:', photoPath);
      
      // Store the actual uploaded file path
      setUploadedFilePaths(prev => ({
        ...prev,
        photo: photoPath
      }));
      
      setPhoto(file);
      
      toast({
        title: "Photo Uploaded",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB) uploaded successfully to ${photoPath}`,
      });
    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      toast({
        title: "Photo Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (field: keyof typeof documents, file: File | null) => {
    if (!validateFileSize(file)) {
      return; // Don't update state if file is too large
    }
    
    if (!file) {
      setDocuments(prev => ({
        ...prev,
        [field]: null
      }));
      // Clear the uploaded file path when file is removed
      setUploadedFilePaths(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }

    // Ensure we have a doctor ID for upload
    if (!preGeneratedDoctorId) {
      toast({
        title: "Upload Error",
        description: "Doctor ID not generated yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`📤 Starting ${field} upload for doctor ID:`, preGeneratedDoctorId);
      
      // Upload document immediately using the file upload service
      const filePath = await uploadDoctorFile(file, preGeneratedDoctorId, field);
      
      console.log(`✅ ${field} uploaded successfully:`, filePath);
      
      // Store the actual uploaded file path
      setUploadedFilePaths(prev => ({
        ...prev,
        [field]: filePath
      }));
      
      setDocuments(prev => ({
        ...prev,
        [field]: file
      }));

      toast({
        title: "Document Uploaded",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB) uploaded successfully`,
      });
    } catch (error) {
      console.error(`❌ ${field} upload failed:`, error);
      toast({
        title: "Document Upload Failed",
        description: error.message || `Failed to upload ${field}`,
        variant: "destructive",
      });
    }
  };

  // Test function to debug upload issues (matches AddPatient)
    const testUpload = async () => {
    if (!photo) {
      toast({
        title: "Test Upload",
        description: "Please select a photo first to test upload",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🧪 Testing upload with photo:', photo.name);
      console.log('🧪 Photo details:', {
        size: photo.size,
        type: photo.type,
        name: photo.name
      });

      toast({
        title: "Test Upload",
        description: `Photo details: ${photo.name} (${(photo.size / (1024 * 1024)).toFixed(2)}MB)`,
      });
    } catch (error) {
      console.error('Test upload error:', error);
      toast({
        title: "Test Upload Failed",
        description: "Error during test upload",
        variant: "destructive",
      });
    }
  };

  // File upload field component (matches AddPatient style)
  const FileUploadField = ({ 
    label, 
    field, 
    accept = ".pdf,.jpg,.jpeg,.png" 
  }: { 
    label: string; 
    field: keyof typeof documents; 
    accept?: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <Input
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(field, e.target.files?.[0] || null)}
          className="hidden"
          id={field}
        />
        <Label
          htmlFor={field}
          className="flex items-center space-x-2 cursor-pointer bg-muted hover:bg-muted/80 px-4 py-3 rounded-lg border border-input transition-colors w-full sm:w-auto min-h-[2.75rem] justify-center sm:justify-start"
        >
          <Upload className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm text-center sm:text-left">
            {documents[field] 
              ? `${documents[field]!.name.length > 25 ? documents[field]!.name.substring(0, 25) + '...' : documents[field]!.name} (${(documents[field]!.size / (1024 * 1024)).toFixed(2)}MB)`
              : 'Choose file (Max 5MB)'
            }
          </span>
        </Label>
        {documents[field] && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFileUpload(field, null)}
            className="w-full sm:w-auto h-11"
          >
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Accepted formats: {accept}. Maximum file size: 5MB
      </p>
    </div>
  );

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          console.log(`File ${file.name} converted to base64, size: ${(reader.result as string).length}`);
          resolve(reader.result as string);
        };
        reader.onerror = error => {
          console.error(`Error converting file ${file.name} to base64:`, error);
          reject(error);
        };
      } catch (error) {
        console.error(`Exception converting file ${file.name} to base64:`, error);
        reject(error);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('=== FORM SUBMISSION STARTED ===');
      console.log('Current form data:', formData);
      console.log('Join date:', joinDate);
      console.log('Photo:', photo);
      console.log('Documents:', documents);
      
      // Validate required fields with detailed checking
      const missingFields = [];
      if (!formData.name || formData.name.trim() === '') missingFields.push('Name');
      if (!formData.email || formData.email.trim() === '') missingFields.push('Email');
      if (!formData.phone || formData.phone.trim() === '') missingFields.push('Phone');
      if (!formData.address || formData.address.trim() === '') missingFields.push('Address');
      if (!formData.specialization || formData.specialization.trim() === '') missingFields.push('Specialization');
      
      console.log('Missing fields check:', missingFields);
      
      if (missingFields.length > 0) {
        console.log('VALIDATION FAILED - Missing fields:', missingFields);
        toast({
          title: 'Validation Error',
          description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Validation passed - proceeding with form submission');

      // Use the pre-generated doctor ID for consistency
      const doctorId = preGeneratedDoctorId;
      console.log('Using pre-generated doctor ID:', doctorId);
      
      // Use actual uploaded file paths (files already uploaded via file upload handlers)
      const photoPath = uploadedFilePaths.photo;
      
      const documentPaths: Record<string, string> = {};
      if (uploadedFilePaths.aadharFront) {
        documentPaths.aadharFront = uploadedFilePaths.aadharFront;
      }
      if (uploadedFilePaths.aadharBack) {
        documentPaths.aadharBack = uploadedFilePaths.aadharBack;
      }
      if (uploadedFilePaths.panFront) {
        documentPaths.panFront = uploadedFilePaths.panFront;
      }
      if (uploadedFilePaths.panBack) {
        documentPaths.panBack = uploadedFilePaths.panBack;
      }
      
      const doctorData = {
        id: doctorId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        specialization: formData.specialization.trim(),
        department: formData.department?.trim() || '',
        join_date: joinDate ? format(joinDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        status: formData.status as 'Active' | 'Inactive',
        photo: photoPath,
        // Only include documents if there are actual documents
        ...(Object.keys(documentPaths).length > 0 && { documents: documentPaths })
      };

      console.log('Final doctor data prepared:', { 
        ...doctorData, 
        photo: photoPath || '[NO PHOTO]',
        documents: documentPaths
      });
      
      console.log('Calling DatabaseService.addDoctor...');
      try {
        const result = await DatabaseService.addDoctor(doctorData);
        console.log('DatabaseService.addDoctor completed successfully:', result);
        
        toast({
          title: 'Doctor Added Successfully!',
          description: `Doctor ${doctorId} has been registered with file uploads.`,
        });
        
        setTimeout(() => {
          navigate('/management/doctors');
        }, 1500);
      } catch (apiError) {
        console.error('DatabaseService.addDoctor failed:', apiError);
        console.error('API Error details:', {
          message: apiError.message,
          stack: apiError.stack,
          name: apiError.name
        });
        throw apiError; // Re-throw to be caught by outer catch block
      }
    } catch (error) {
      console.error('Detailed error information:', error);
      console.error('Error stack:', error.stack);
      console.error('Form data at time of error:', formData);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Error',
        description: `Failed to add doctor: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pl-1 pr-3 sm:pl-2 sm:pr-4 lg:pl-3 lg:pr-6 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* Modern Floating Header */}
        <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl mb-4 sm:mb-6 lg:mb-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Add New Doctor
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Ready to submit</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Doctor Information */}
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg">
            <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                Doctor Information
              </CardTitle>
            </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="name">Doctor Name *</Label>
              <Input
                id="name"
                placeholder="Enter doctor's full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              {specializations.length > 0 ? (
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => {
                    if (value === '__add_specialization__') {
                      navigate('/management/doctor-category');
                    } else {
                      handleInputChange('specialization', value);
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                    <SelectItem value="__add_specialization__">+ Add New Specialization</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="specialization"
                  placeholder="Enter specialization (e.g., Cardiology, Neurology)"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Enter department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                placeholder="Enter salary"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Join Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !joinDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {joinDate ? format(joinDate, "PPP") : "Pick join date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={joinDate}
                    onSelect={setJoinDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="photo" className="text-sm font-medium">Doctor Photo</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                  className="hidden"
                  id="photo"
                />
                <Label
                  htmlFor="photo"
                  className="flex items-center space-x-2 cursor-pointer bg-muted hover:bg-muted/80 px-4 py-3 rounded-lg border border-input transition-colors w-full sm:w-auto min-h-[2.75rem] justify-center sm:justify-start"
                >
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-center sm:text-left">
                    {photo 
                      ? `${photo.name.length > 20 ? photo.name.substring(0, 20) + '...' : photo.name} (${(photo.size / (1024 * 1024)).toFixed(2)}MB)`
                      : 'Choose photo (Max 5MB)'
                    }
                  </span>
                </Label>
                {photo && (
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPhoto(null)}
                      className="flex-1 sm:flex-none h-11"
                    >
                      Remove
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={testUpload}
                      className="flex-1 sm:flex-none h-11"
                    >
                      Test Upload
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, JPEG, PNG, GIF. Maximum file size: 5MB
              </p>
            </div>

            {/* Document Upload Section */}
            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
                <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                    Document Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-base">Aadhar Card</h4>
                      <FileUploadField label="Aadhar Card Front" field="aadharFront" accept="image/*" />
                      <FileUploadField label="Aadhar Card Back" field="aadharBack" accept="image/*" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-base">PAN Card</h4>
                      <FileUploadField label="PAN Card Front" field="panFront" accept="image/*" />
                      <FileUploadField label="PAN Card Back" field="panBack" accept="image/*" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/management/doctors')}
            className="header-action-btn header-action-btn--clear h-11 px-6 w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="header-action-btn header-action-btn--primary h-11 px-8 w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? 'Adding Doctor...' : 'Add Doctor'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};
export default AddDoctor;
