import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoctorAdvanceFormData, DoctorListItem, DoctorAdvance } from '@/types/doctorAdvance';
import { DoctorAdvanceAPI } from '@/services/doctorAdvanceAPI';
import { toast } from 'sonner';
import { Calendar, IndianRupee, FileText, User } from 'lucide-react';

interface DoctorAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctors: DoctorListItem[];
  editData?: DoctorAdvance | null;
}

const DoctorAdvanceModal: React.FC<DoctorAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  doctors,
  editData
}) => {
  const [formData, setFormData] = useState<DoctorAdvanceFormData>({
    doctor_id: '',
    doctor_name: '',
    date: '',
    amount: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or edit data changes
  useEffect(() => {
    if (isOpen && editData) {
      // Edit mode
      setFormData({
        doctor_id: editData.doctor_id,
        doctor_name: editData.doctor_name,
        date: editData.date,
        amount: editData.amount,
        reason: editData.reason || ''
      });
    } else if (isOpen) {
      // Create mode
      setFormData({
        doctor_id: '',
        doctor_name: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        reason: ''
      });
    }
  }, [isOpen, editData]);

  const handleDoctorSelect = (doctorId: string) => {
    const selectedDoctor = doctors.find(d => d.doctor_id === doctorId);
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctor_id: doctorId,
        doctor_name: selectedDoctor.doctor_name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctor_id || !formData.doctor_name || !formData.date || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount
      };

      if (editData) {
        // Update existing record
        await DoctorAdvanceAPI.update(editData.id!, submitData);
        toast.success('Doctor advance updated successfully!');
      } else {
        // Create new record
        await DoctorAdvanceAPI.create(submitData);
        toast.success('Doctor advance created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving doctor advance:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save doctor advance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            {editData ? 'Edit Doctor Advance' : 'Add Doctor Advance'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctor" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Doctor *
            </Label>
            <Select 
              value={formData.doctor_id} 
              onValueChange={handleDoctorSelect}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.doctor_id} value={doctor.doctor_id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doctor.doctor_name}</span>
                      {doctor.specialization && (
                        <span className="text-sm text-slate-500">({doctor.specialization})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Amount (₹) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reason
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for advance (optional)"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.doctor_id || !formData.date || !formData.amount}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editData ? 'Update Advance' : 'Create Advance'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorAdvanceModal;
