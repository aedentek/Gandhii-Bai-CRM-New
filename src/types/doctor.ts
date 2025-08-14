export interface Doctor {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  department?: string;
  join_date?: string;
  salary?: number;
  status?: 'Active' | 'Inactive';
  photo?: string;
  documents?: any;
  total_paid?: number;
  payment_mode?: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  payment_month?: number;
  payment_year?: number;
  last_payment_date?: string;
}
