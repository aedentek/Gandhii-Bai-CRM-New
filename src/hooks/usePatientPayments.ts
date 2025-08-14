import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/databaseService';

export interface PaymentRecord {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  comment: string;
  paymentMode: string;
  balanceRemaining: number;
  createdBy: string;
  createdAt: string;
}

export interface PatientPaymentData {
  patientId: string;
  name: string;
  registrationId: string;
  totalFees: number;
  advancePaid: number;
  payments: PaymentRecord[];
}

export const usePatientPayments = () => {
  const [patientPayments, setPatientPayments] = useState<PatientPaymentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatientPayments();
  }, []);

  const loadPatientPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load patients from database with localStorage fallback
      let patientsData = [];
      try {
        patientsData = await DatabaseService.getAllPatients();
      } catch (dbError) {
        console.warn('Database error, falling back to localStorage:', dbError);
        const storedPatients = localStorage.getItem('patients');
        if (storedPatients) {
          patientsData = JSON.parse(storedPatients);
        }
      }
      
      // Load payment records from database with localStorage fallback
      let paymentRecords = [];
      try {
        paymentRecords = await DatabaseService.getAllPatientPayments();
      } catch (dbError) {
        console.warn('Database error for payments, falling back to localStorage:', dbError);
        const storedPayments = localStorage.getItem('patientPaymentRecords');
        if (storedPayments) {
          paymentRecords = JSON.parse(storedPayments);
        }
      }
      
      // Create payment data structure
      const paymentData = patientsData.map((patient: any) => {
        // Filter payments for this patient
        const patientPaymentRecords = paymentRecords.filter((record: any) => 
          record.patientId == patient.id || record.patientId === patient.id
        );
        
        // Calculate fees from patient data using correct field names
        const monthlyFees = Number(patient.fees || patient.monthlyFees || patient.totalFees || 0);
        const bloodTest = Number(patient.bloodTest || patient.blood_test || 0);
        const pickupCharge = Number(patient.pickupCharge || patient.pickup_charge || 0);
        const totalFees = monthlyFees + bloodTest + pickupCharge;
        const advancePaid = Number(patient.payAmount || patient.pay_amount || 0);
        
        // If no payment records exist but patient has payAmount, create initial record
        if (patientPaymentRecords.length === 0 && advancePaid > 0) {
          const initialPayment: PaymentRecord = {
            id: `${patient.id}-initial`,
            patientId: patient.id.toString(),
            date: patient.admissionDate || patient.created_at || new Date().toISOString().split('T')[0],
            amount: advancePaid,
            comment: 'Initial payment',
            paymentMode: patient.paymentType || 'Cash',
            balanceRemaining: Math.max(0, totalFees - advancePaid),
            createdBy: 'System',
            createdAt: new Date().toISOString()
          };
          patientPaymentRecords.push(initialPayment);
        }
        
        return {
          patientId: patient.id.toString(),
          name: patient.name,
          registrationId: patient.registrationId || patient.id.toString(),
          totalFees,
          advancePaid,
          payments: patientPaymentRecords.map((record: any) => ({
            ...record,
            patientId: record.patientId.toString(),
            id: record.id.toString()
          }))
        };
      });
      
      setPatientPayments(paymentData);
    } catch (error) {
      console.error('Error loading patient payments:', error);
      setError('Failed to load patient payments');
      // Fallback to localStorage
      try {
        const storedPatients = localStorage.getItem('patients');
        const storedPayments = localStorage.getItem('patientPaymentRecords');
        if (storedPatients) {
          const patientsData = JSON.parse(storedPatients);
          const paymentRecords = JSON.parse(storedPayments || '[]');
          
          const paymentData = patientsData.map((patient: any) => {
            const patientPaymentRecords = paymentRecords.filter((record: PaymentRecord) => record.patientId === patient.id);
            const monthlyFees = Number(patient.fees || patient.monthlyFees || patient.totalFees || 0);
            const bloodTest = Number(patient.bloodTest || patient.blood_test || 0);
            const pickupCharge = Number(patient.pickupCharge || patient.pickup_charge || 0);
            const totalFees = monthlyFees + bloodTest + pickupCharge;
            const advancePaid = Number(patient.payAmount || patient.pay_amount || 0);
            
            return {
              patientId: patient.id,
              name: patient.name,
              registrationId: patient.registrationId || patient.id,
              totalFees,
              advancePaid,
              payments: patientPaymentRecords
            };
          });
          
          setPatientPayments(paymentData);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setPatientPayments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (patientId: string, paymentData: Omit<PaymentRecord, 'id' | 'patientId' | 'createdBy' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = JSON.parse(localStorage.getItem('healthcare_user') || '{}');
      const newPayment = {
        patientId: parseInt(patientId),
        ...paymentData,
        createdBy: currentUser.name || 'Unknown',
        createdAt: new Date().toISOString()
      };

      // Try to save to database first
      let savedPayment;
      try {
        savedPayment = await DatabaseService.addPatientPayment(newPayment);
      } catch (dbError) {
        console.warn('Database error, saving to localStorage:', dbError);
        // Fallback to localStorage
        const existingRecords = JSON.parse(localStorage.getItem('patientPaymentRecords') || '[]');
        savedPayment = {
          id: `${patientId}-${Date.now()}`,
          ...newPayment,
          patientId: patientId
        };
        existingRecords.push(savedPayment);
        localStorage.setItem('patientPaymentRecords', JSON.stringify(existingRecords));
      }

      // Update state
      setPatientPayments(prev => prev.map(patient => 
        patient.patientId === patientId 
          ? { 
              ...patient, 
              payments: [...patient.payments, {
                ...savedPayment,
                id: savedPayment.id.toString(),
                patientId: savedPayment.patientId.toString()
              }] 
            }
          : patient
      ));

      // Update patient record balance
      try {
        const patientData = patientPayments.find(p => p.patientId === patientId);
        if (patientData) {
          const newTotalPaid = [...patientData.payments, savedPayment].reduce((sum, p) => sum + Number(p.amount), 0);
          const newBalance = Math.max(0, patientData.totalFees - newTotalPaid);
          
          try {
            await DatabaseService.updatePatient(patientId, {
              payAmount: newTotalPaid,
              balance: newBalance
            });
          } catch (dbError) {
            console.warn('Failed to update patient balance in database:', dbError);
            // Update localStorage fallback
            const patients = JSON.parse(localStorage.getItem('patients') || '[]');
            const updatedPatients = patients.map((patient: any) => {
              if (patient.id == patientId) {
                return {
                  ...patient,
                  payAmount: newTotalPaid,
                  balance: newBalance
                };
              }
              return patient;
            });
            localStorage.setItem('patients', JSON.stringify(updatedPatients));
          }
        }
      } catch (error) {
        console.error('Error updating patient balance:', error);
      }

      return savedPayment;
    } catch (error) {
      console.error('Error adding payment:', error);
      setError('Failed to add payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePatientPaymentConfig = (patientId: string, totalFees: number, advancePaid: number) => {
    try {
      const configs = JSON.parse(localStorage.getItem('patientPaymentConfigs') || '[]');
      const existingConfigIndex = configs.findIndex((config: any) => config.patientId === patientId);
      
      const newConfig = {
        patientId,
        totalFees,
        advancePaid,
        updatedAt: new Date().toISOString()
      };

      if (existingConfigIndex >= 0) {
        configs[existingConfigIndex] = newConfig;
      } else {
        configs.push(newConfig);
      }

      localStorage.setItem('patientPaymentConfigs', JSON.stringify(configs));

      // Update state
      setPatientPayments(prev => prev.map(patient => 
        patient.patientId === patientId 
          ? { ...patient, totalFees, advancePaid }
          : patient
      ));

      // Also update the main patient record
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      const updatedPatients = patients.map((patient: any) => 
        patient.id === patientId 
          ? { ...patient, totalAmount: totalFees, payAmount: advancePaid }
          : patient
      );
      localStorage.setItem('patients', JSON.stringify(updatedPatients));

    } catch (error) {
      console.error('Error updating patient payment config:', error);
      throw error;
    }
  };

  const getPatientPaymentSummary = () => {
    return patientPayments.map(patient => {
      const totalCollected = patient.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balancePending = Math.max(0, patient.totalFees - totalCollected);
      
      return {
        ...patient,
        totalCollected,
        balancePending,
        status: balancePending <= 0 ? 'Paid' : balancePending < patient.totalFees ? 'Partial' : 'Pending'
      };
    });
  };

  const getOverallTotals = () => {
    const summary = getPatientPaymentSummary();
    return summary.reduce(
      (totals, patient) => ({
        totalPaid: totals.totalPaid + patient.totalCollected,
        totalDue: totals.totalDue + patient.totalFees,
        totalPending: totals.totalPending + patient.balancePending
      }),
      { totalPaid: 0, totalDue: 0, totalPending: 0 }
    );
  };

  return {
    patientPayments,
    loading,
    error,
    addPayment,
    updatePatientPaymentConfig,
    getPatientPaymentSummary,
    getOverallTotals,
    refreshData: loadPatientPayments
  };
};