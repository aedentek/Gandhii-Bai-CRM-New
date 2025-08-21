import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaffAdvanceFormData, StaffListItem, StaffAdvance } from '@/types/staffAdvance';
import { StaffAdvanceAPI } from '@/services/staffAdvanceAPI';
import { toast } from 'sonner';
import { Calendar, DollarSign, FileText, User } from 'lucide-react';

interface StaffAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: StaffListItem[];
  editData?: StaffAdvance | null;
}

const StaffAdvanceModal: React.FC<StaffAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
  editData
}) => {
  const [formData, setFormData] = useState<StaffAdvanceFormData>({
    staff_id: '',
    staff_name: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          staff_id: editData.staff_id,
          staff_name: editData.staff_name,
          date: editData.date,
          amount: editData.amount,
          reason: editData.reason || ''
        });
      } else {
        setFormData({
          staff_id: '',
          staff_name: '',
          date: new Date().toISOString().split('T')[0],
          amount: '',
          reason: ''
        });
      }
    }
  }, [isOpen, editData]);

  // Handle staff selection
  const handleStaffChange = (staffId: string) => {
    const selectedStaff = staff.find(s => s.staff_id === staffId);
    if (selectedStaff) {
      setFormData(prev => ({
        ...prev,
        staff_id: staffId,
        staff_name: selectedStaff.staff_name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.staff_id || !formData.staff_name || !formData.date || !formData.amount) {
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
        await StaffAdvanceAPI.update(editData.id!, submitData);
        toast.success('Staff advance updated successfully!');
      } else {
        // Create new record
        await StaffAdvanceAPI.create(submitData);
        toast.success('Staff advance created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving staff advance:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save staff advance');
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
            <DollarSign className="h-5 w-5 text-green-600" />
            {editData ? 'Edit Staff Advance' : 'Add Staff Advance'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Staff *
            </Label>
            <Select 
              value={formData.staff_id} 
              onValueChange={handleStaffChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((staffMember) => (
                  <SelectItem key={staffMember.staff_id} value={staffMember.staff_id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{staffMember.staff_name}</span>
                      <span className="text-xs text-gray-500">({staffMember.staff_id})</span>
                      {staffMember.role && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                          {staffMember.role}
                        </span>
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
              <DollarSign className="h-4 w-4" />
              Amount (₹) *
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter advance amount"
              min="0"
              step="0.01"
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
              disabled={isSubmitting || !formData.staff_id || !formData.date || !formData.amount}
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

export default StaffAdvanceModal;
