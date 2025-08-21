export interface Staff {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  role?: string;
  category_id?: number;
  department?: string;
  salary?: number;
  joinDate?: string;
  join_date?: string;
  status: 'Active' | 'Inactive';
  photo?: string;
  documents?: {
    aadharFront?: string;
    aadharBack?: string;
    panFront?: string;
    panBack?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface StaffCategory {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  department: string;
  salary: string;
  status: 'Active' | 'Inactive';
}

export interface StaffDocuments {
  aadharFront: File | null;
  aadharBack: File | null;
  panFront: File | null;
  panBack: File | null;
}
