import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface MonthYearPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onApply: () => void;
  onShowAll?: () => void;
  title?: string;
  description?: string;
  previewText?: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthYearPickerDialog: React.FC<MonthYearPickerDialogProps> = ({
  open,
  onOpenChange,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onApply,
  onShowAll,
  title = "Select Month & Year",
  description = "Filter data by specific month and year",
  previewText = "data"
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month" className="text-sm font-medium text-gray-700">Month</Label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => {
                  onMonthChange(Number(value));
                }}
              >
                <SelectTrigger 
                  className="w-full border-primary/30 focus:border-primary"
                  onClick={(e) => e.preventDefault()}
                >
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {months.map((month, idx) => (
                    <SelectItem key={month} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium text-gray-700">Year</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => {
                  onYearChange(Number(value));
                }}
              >
                <SelectTrigger 
                  className="w-full border-primary/30 focus:border-primary"
                  onClick={(e) => e.preventDefault()}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {[...Array(10)].map((_, i) => {
                    const year = currentYear - 5 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Preview Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter Preview</span>
            </div>
            <p className="text-gray-600 text-sm">
              Showing {previewText} from <span className="font-semibold text-blue-600">{months[selectedMonth - 1]} {selectedYear}</span>
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto modern-btn modern-btn-secondary"
          >
            Cancel
          </Button>
          {onShowAll && (
            <Button 
              type="button" 
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                onShowAll();
              }}
              className="w-full sm:w-auto modern-btn modern-btn-accent"
            >
              Show All Months
            </Button>
          )}
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              onApply();
            }}
            className="w-full sm:w-auto global-btn"
          >
            Apply Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MonthYearPickerDialog;
