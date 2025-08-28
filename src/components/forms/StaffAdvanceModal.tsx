import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaffAdvanceFormData, StaffListItem, StaffAdvance } from '@/types/staffAdvance';
import { StaffAdvanceAPI } from '@/services/staffAdvanceAPI';
import { toast } from 'sonner';
import { Calendar, IndianRupee, FileText, User, X, Save, Plus, Edit } from 'lucide-react';
import '@/styles/global-modal-design.css';

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
      <DialogContent className="editpopup form crm-modal-container sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="editpopup form crm-modal-header">
          <DialogTitle className="editpopup form crm-modal-title text-xl font-semibold text-slate-800 flex items-center gap-2">
            {editData ? (
              <>
                <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Edit Staff Advance
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Add Staff Advance
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="editpopup form crm-edit-form">
          <div className="editpopup form crm-edit-form-grid">
            {/* Staff Selection */}
            <div className="editpopup form crm-edit-form-group">
              <Label htmlFor="staff" className="editpopup form crm-edit-form-label required flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Staff
              </Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={handleStaffChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="editpopup form crm-edit-form-select">
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
          <div className="editpopup form crm-edit-form-group">
            <Label htmlFor="date" className="editpopup form crm-edit-form-label required flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={isSubmitting}
              required
              className="editpopup form crm-edit-form-input"
            />
          </div>

          {/* Amount */}
          <div className="editpopup form crm-edit-form-group">
            <Label htmlFor="amount" className="editpopup form crm-edit-form-label required flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Amount (₹)
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
              className="editpopup form crm-edit-form-input"
            />
          </div>

          {/* Reason */}
          <div className="editpopup form crm-edit-form-group">
            <Label htmlFor="reason" className="editpopup form crm-edit-form-label flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reason (Optional)
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for advance (optional)"
              rows={3}
              disabled={isSubmitting}
              className="editpopup form crm-edit-form-textarea"
            />
          </div>
          </div>
        </form>

        <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.staff_id || !formData.date || !formData.amount}
            className="editpopup form footer-button-save w-full sm:w-auto global-btn"
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {editData ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                {editData ? 'Update Advance' : 'Create Advance'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffAdvanceModal;
