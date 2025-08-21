export interface TestReportAmount {
  id: string;
  patient_id: string;
  patient_name: string;
  test_type: string;
  test_date: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTestReportAmountData {
  patient_id: string;
  test_type: string;
  test_date: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface UpdateTestReportAmountData {
  test_type?: string;
  test_date?: string;
  amount?: number;
  status?: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
}