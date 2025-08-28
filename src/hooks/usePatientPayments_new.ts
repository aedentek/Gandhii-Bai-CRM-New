import { useState, useEffect } from 'react';

export interface PatientPaymentRecord {
  id: number;
  patient_id: string;
  patient_name: string;
  test_report_amount: number;
  carry_forward: number;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  payment_status: 'pending' | 'partial' | 'completed';
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface PatientPaymentHistory {
  id: number;
  patient_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  notes: string;
  created_at: string;
}

export interface PatientPaymentStats {
  totalPatients: number;
  totalTestReportAmount: number;
  totalPaid: number;
  totalPending: number;
}

export interface UsePatientPaymentsResult {
  patientPayments: PatientPaymentRecord[];
  stats: PatientPaymentStats;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  selectedMonth: number;
  selectedYear: number;
  setCurrentPage: (page: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  refreshData: () => Promise<void>;
  saveMonthlyRecords: () => Promise<void>;
  recordPayment: (patientId: string, amount: number, method: string, notes?: string) => Promise<void>;
  getPaymentHistory: (patientId: string) => Promise<PatientPaymentHistory[]>;
}

const usePatientPayments = (): UsePatientPaymentsResult => {
  const [patientPayments, setPatientPayments] = useState<PatientPaymentRecord[]>([]);
  const [stats, setStats] = useState<PatientPaymentStats>({
    totalPatients: 0,
    totalTestReportAmount: 0,
    totalPaid: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const recordsPerPage = 10;

  const fetchPatientPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
      });

      const response = await fetch(`/api/patient-payments/all?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setPatientPayments(data.payments || []);
      setStats(data.stats || {
        totalPatients: 0,
        totalTestReportAmount: 0,
        totalPaid: 0,
        totalPending: 0,
      });
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching patient payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patient payments');
      setPatientPayments([]);
      setStats({
        totalPatients: 0,
        totalTestReportAmount: 0,
        totalPaid: 0,
        totalPending: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchPatientPayments();
  };

  const saveMonthlyRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patient-payments/save-monthly-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save monthly records');
      }

      await refreshData();
    } catch (err) {
      console.error('Error saving monthly records:', err);
      setError(err instanceof Error ? err.message : 'Failed to save monthly records');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (patientId: string, amount: number, method: string, notes?: string) => {
    try {
      const response = await fetch('/api/patient-payments/record-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          amount_paid: amount,
          payment_method: method,
          notes: notes || '',
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      await refreshData();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
  };

  const getPaymentHistory = async (patientId: string): Promise<PatientPaymentHistory[]> => {
    try {
      const response = await fetch(`/api/patient-payments/history/${patientId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      const data = await response.json();
      return data.history || [];
    } catch (err) {
      console.error('Error fetching payment history:', err);
      return [];
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when month/year changes
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPatientPayments();
  }, [currentPage, selectedMonth, selectedYear]);

  return {
    patientPayments,
    stats,
    loading,
    error,
    currentPage,
    totalPages,
    selectedMonth,
    selectedYear,
    setCurrentPage,
    setSelectedMonth,
    setSelectedYear,
    refreshData,
    saveMonthlyRecords,
    recordPayment,
    getPaymentHistory,
  };
};

export default usePatientPayments;
