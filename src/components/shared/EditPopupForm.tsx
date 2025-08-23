import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EditPopupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  saveButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
}

const EditPopupForm: React.FC<EditPopupFormProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  onSave,
  onCancel,
  children,
  maxWidth = "sm:max-w-[800px]",
  saveButtonText = "Save Changes",
  cancelButtonText = "Cancel",
  isLoading = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`editpopup form dialog-content ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="editpopup form dialog-header relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-center gap-3">
            <div className="editpopup form dialog-header icon-container p-2 bg-blue-100 rounded-lg">
              <div className="editpopup form dialog-header icon h-5 w-5 text-blue-600">
                {icon}
              </div>
            </div>
            <div>
              <DialogTitle className="editpopup form dialog-title text-xl font-bold text-gray-900">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="editpopup form dialog-description text-gray-600 mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="editpopup form form-container space-y-6 p-3 sm:p-4 md:p-6">
          {children}
        </div>
        
        <DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {cancelButtonText}
          </Button>
          <Button 
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="editpopup form footer-button-save w-full sm:w-auto global-btn"
          >
            {saveButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPopupForm;
