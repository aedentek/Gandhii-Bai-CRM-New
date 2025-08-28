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
import { CalendarIcon, Upload, Users, Phone, Mail, MapPin, FileText, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { uploadStaffFile, getStaffFileUrl } from '@/services/staffFileUpload';
import { Staff, StaffFormData, StaffDocuments, StaffCategory } from '@/types/staff';
import usePageTitle from '@/hooks/usePageTitle';
import '../../styles/selective-header-buttons-new.css';

const AddStaff: React.FC = () => {
  // Set page title
  usePageTitle();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joinDate, setJoinDate] = useState<Date>();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preGeneratedStaffId, setPreGeneratedStaffId] = useState<string>(''); // Store the staff ID for upload

  // Helper function to generate next staff ID
  const generateNextStaffId = async (): Promise<string> => {
    try {
      // Get existing staff from API
      const [staffResponse, categoriesResponse] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/staff-categories')
      ]);

      if (!staffResponse.ok) {
        throw new Error('Failed to fetch staff data');
      }

      const existingStaff = await staffResponse.json();
      let maxNum = 0;
      
      existingStaff.forEach((s: any) => {
        if (s.id && /^STF\d{3,}$/.test(s.id)) {
          const num = parseInt(s.id.replace('STF', ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      
      return `STF${String(maxNum + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating staff ID:', error);
      // Fallback: use timestamp-based ID if API fetch fails
      return `STF${String(Date.now()).slice(-3)}`;
    }
  };
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    department: '',
    salary: '',
    status: 'Active',
  });
  const [staffCategories, setStaffCategories] = useState<string[]>([]);

  useEffect(() => {
    loadStaffCategories();
  }, []);

  const loadStaffCategories = async () => {
    try {
      console.log('Fetching staff categories from API...');
      const response = await fetch('/api/staff-categories');
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const categories: StaffCategory[] = await response.json();
      console.log('Fetched categories:', categories);
      
      // Extract only active category names for the dropdown
      const categoryNames = categories
        .filter((cat: StaffCategory) => cat.status === 'active')
        .map((cat: StaffCategory) => cat.name);
      
      setStaffCategories(categoryNames);
      console.log('Set staff categories:', categoryNames);
    } catch (error) {
      console.error('Error fetching staff categories from API:', error);
      
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('staffCategories');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setStaffCategories(parsed.map((cat: any) => typeof cat === 'string' ? cat : cat.name || ''));
          }
        } catch {
          setStaffCategories([]);
        }
      } else {
        setStaffCategories([]);
      }
      
      toast({
        title: "Warning",
        description: "Failed to load staff categories from API. Using local data.",
        variant: "destructive",
      });
    }
  };
  const [documents, setDocuments] = useState<StaffDocuments>({
    aadharFront: null,
    aadharBack: null,
    panFront: null,
    panBack: null,
  });

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    // For phone number, only allow numeric input and limit to 10 digits
    if (field === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

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

  // Handle photo upload with validation
  const handlePhotoUpload = async (file: File | null) => {
    if (!validateFileSize(file)) {
      return; // Don't update state if file is too large
    }
    
    setPhoto(file);
    
    if (file) {
      // Generate and store the staff ID that will be used
      let staffIdToUse = preGeneratedStaffId;
      if (!staffIdToUse) {
        staffIdToUse = await generateNextStaffId();
        setPreGeneratedStaffId(staffIdToUse);
        console.log('📋 Generated Staff ID for upload:', staffIdToUse);
      }
      
      toast({
        title: "Photo Selected",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB) selected. Will upload with Staff ID: ${staffIdToUse}`,
      });
    } else {
      // Clear photo and staff ID when no file is selected
      setPreGeneratedStaffId('');
    }
  };

  const handleFileUpload = (field: keyof StaffDocuments, file: File | null) => {
    if (!validateFileSize(file)) {
      return; // Don't update state if file is too large
    }
    
    setDocuments(prev => ({
      ...prev,
      [field]: file
    }));

    if (file) {
      toast({
        title: "File Selected",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB) selected successfully`,
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
    field: keyof StaffDocuments; 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.role) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Use pre-generated staff ID if photo was selected, otherwise generate new one
      const nextId = preGeneratedStaffId || await generateNextStaffId();
      
      console.log('🆔 Using Staff ID for form submission:', nextId);
      console.log('🆔 Pre-generated ID:', preGeneratedStaffId);

      // Upload photo if selected
      let finalPhotoPath = '';
      if (photo) {
        try {
          console.log('📤 Uploading photo with Staff ID:', nextId);
          finalPhotoPath = await uploadStaffFile(photo, nextId, 'profile_photo');
          console.log('✅ Photo uploaded to:', finalPhotoPath);
        } catch (error) {
          console.error('❌ Photo upload failed:', error);
          toast({
            title: 'Upload Error',
            description: `Failed to upload photo: ${error.message}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Upload documents
      const documentPaths = {
        aadharFront: '',
        aadharBack: '',
        panFront: '',
        panBack: ''
      };

      // Upload aadhar front
      if (documents.aadharFront) {
        try {
          documentPaths.aadharFront = await uploadStaffFile(documents.aadharFront, nextId, 'aadharFront');
          console.log('✅ Aadhar front uploaded:', documentPaths.aadharFront);
        } catch (error) {
          console.error('❌ Aadhar front upload failed:', error);
          toast({
            title: 'Upload Error',
            description: `Failed to upload Aadhar front: ${error.message}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Upload aadhar back
      if (documents.aadharBack) {
        try {
          documentPaths.aadharBack = await uploadStaffFile(documents.aadharBack, nextId, 'aadharBack');
          console.log('✅ Aadhar back uploaded:', documentPaths.aadharBack);
        } catch (error) {
          console.error('❌ Aadhar back upload failed:', error);
          toast({
            title: 'Upload Error',
            description: `Failed to upload Aadhar back: ${error.message}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Upload PAN front
      if (documents.panFront) {
        try {
          documentPaths.panFront = await uploadStaffFile(documents.panFront, nextId, 'panFront');
          console.log('✅ PAN front uploaded:', documentPaths.panFront);
        } catch (error) {
          console.error('❌ PAN front upload failed:', error);
          toast({
            title: 'Upload Error',
            description: `Failed to upload PAN front: ${error.message}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Upload PAN back
      if (documents.panBack) {
        try {
          documentPaths.panBack = await uploadStaffFile(documents.panBack, nextId, 'panBack');
          console.log('✅ PAN back uploaded:', documentPaths.panBack);
        } catch (error) {
          console.error('❌ PAN back upload failed:', error);
          toast({
            title: 'Upload Error',
            description: `Failed to upload PAN back: ${error.message}`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Get category ID from the selected role name
      let categoryId = null;
      if (formData.role) {
        try {
          const categoriesResponse = await fetch('/api/staff-categories');
          if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            const selectedCategory = categories.find((cat: any) => cat.name === formData.role);
            categoryId = selectedCategory ? selectedCategory.id : null;
          }
        } catch (error) {
          console.warn('Could not fetch category ID:', error);
        }
      }

      // Format join date as YYYY-MM-DD for MySQL DATE format
      const formattedJoinDate = joinDate ? 
        joinDate.toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];

      // Prepare staff data for API
      const staffData: Partial<Staff> = {
        id: nextId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        category_id: categoryId,
        department: formData.department,
        join_date: formattedJoinDate,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        status: formData.status,
        photo: finalPhotoPath,
        documents: documentPaths
      };

      console.log('📤 Sending staff data to API:', staffData);

      // Send data to backend API
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      console.log('📡 Staff creation response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
          console.error('❌ Staff creation failed - Error data:', errorData);
        } catch {
          // If response is not JSON (e.g., HTML error page), get text
          const errorText = await response.text();
          errorMessage = `HTTP ${response.status} - ${response.statusText}`;
          console.error('❌ Staff creation failed - Non-JSON response:', errorText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Staff created successfully:', result);

      toast({
        title: 'Staff Added Successfully!',
        description: `Staff ${nextId} has been registered in the database.`,
      });
      
      setTimeout(() => {
        navigate('/management/staff');
      }, 1500);
      
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: `Failed to add staff: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

// Always show the form, even if there are no categories
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
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Add New Staff
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Ready to submit</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Staff Information */}
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg">
            <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                Staff Information
              </CardTitle>
            </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            {/* ...existing fields... */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter staff's full name"
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
              <Label htmlFor="role">Staff Category *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  if (value === '__add_category__') {
                    navigate('/management/staff-category');
                  } else {
                    handleInputChange('role', value);
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={staffCategories.length === 0 ? 'Add Category' : 'Select staff category'} />
                </SelectTrigger>
                <SelectContent>
                  {staffCategories.length > 0 ? (
                    staffCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__add_category__">Add Category</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              <Label htmlFor="photo" className="text-sm font-medium">Staff Photo</Label>
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
                      onClick={() => {
                        setPhoto(null);
                        setPreGeneratedStaffId(''); // Clear the pre-generated ID when removing photo
                      }}
                      className="flex-1 sm:flex-none h-11"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              {preGeneratedStaffId && (
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Photo will be saved with Staff ID: {preGeneratedStaffId}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, JPEG, PNG, GIF. Maximum file size: 5MB. Photos will be saved to server/photos/Staff Admission/{'{'}STF_ID{'}'}.
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
            onClick={() => navigate('/management/staff')}
            className="header-action-btn header-action-btn--clear h-11 px-6 w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || staffCategories.length === 0}
            className="header-action-btn header-action-btn--primary h-11 px-8 w-full sm:w-auto order-1 sm:order-2"
          >
            {staffCategories.length === 0 ? 'Add Staff (Add Category First)' : (loading ? 'Adding Staff...' : 'Add Staff')}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default AddStaff;
