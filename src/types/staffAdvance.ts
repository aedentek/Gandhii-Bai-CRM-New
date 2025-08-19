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
  id: number;
  staff_id: string;
  name: string;
  phone?: string;
  photo?: string;
  department?: string;
  status?: string;
  join_date?: string;
}
