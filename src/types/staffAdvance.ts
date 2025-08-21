export interface StaffAdvance {
  id?: number;
  staff_id: string;
  staff_name: string;
  date: string;
  amount: number;
  reason?: string;
  phone?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAdvanceFormData {
  staff_id: string;
  staff_name: string;
  date: string;
  amount: number | string;
  reason?: string;
}

export interface StaffListItem {
  staff_id: string;
  staff_name: string;
  phone?: string;
  photo?: string;
  role?: string;
  department?: string;
  status?: string;
}
