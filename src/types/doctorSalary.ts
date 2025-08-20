export interface DoctorSalary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  department?: string;
  salary: string | number;
  total_paid: string | number;
  monthly_paid?: string | number;  // New field for monthly-specific payments
  balance?: string | number;       // New field calculated on backend
  advance_amount?: string | number;
  carry_forward?: string | number;
  payment_mode?: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  status: string;
  photo?: string;
  join_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorSalaryPayment {
  doctorId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  notes?: string;
  previousTotalPaid?: number;
  newTotalPaid?: number;
  month?: number;
  year?: number;
  status?: string;
}

export interface DoctorSalaryHistory {
  id: number;
  doctor_id: string;
  payment_amount: number;
  payment_date: string;
  payment_mode: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  previous_total_paid: number;
  new_total_paid: number;
  month: number;
  year: number;
  notes?: string;
  created_at: string;
}

export interface DoctorMonthlySalary {
  id: number;
  doctor_id: string;
  month: number;
  year: number;
  total_paid: number;
  payment_mode?: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  status: 'Paid' | 'Pending' | 'Partial';
  created_at: string;
  updated_at: string;
}

export interface DoctorSalarySummary {
  doctors: DoctorSalary[];
  summary: {
    totalSalary: number;
    totalPaid: number;
    totalPending: number;
  };
}
