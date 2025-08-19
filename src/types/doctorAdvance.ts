export interface DoctorAdvance {
  id?: number;
  doctor_id: string;
  doctor_name: string;
  date: string;
  amount: number;
  reason?: string;
  phone?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorAdvanceFormData {
  doctor_id: string;
  doctor_name: string;
  date: string;
  amount: number | string;
  reason?: string;
}

export interface DoctorListItem {
  doctor_id: string;
  doctor_name: string;
  phone?: string;
  photo?: string;
  specialization?: string;
  status?: string;
}
