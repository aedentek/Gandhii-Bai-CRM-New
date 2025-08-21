import React, { useState } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import HeaderActionButtons, { ActionButtons } from '@/components/ui/HeaderActionButtons';
import OutlineActionButton from '@/components/ui/OutlineActionButton';

// Example of how to use the reusable header action buttons

const ExampleUsage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 2000);
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleMonthYearClick = () => {
    console.log('Opening month/year picker...');
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Header Action Buttons Examples</h1>

      {/* Method 1: Using HeaderActionButtons component with all common buttons */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Method 1: All-in-one HeaderActionButtons</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <HeaderActionButtons
            onRefresh={handleRefresh}
            refreshLoading={loading}
            
            onExport={handleExport}
            exportText="Export CSV"
            
            onMonthYearClick={handleMonthYearClick}
            monthYearText={`${months[selectedMonth]} ${selectedYear}`}
            
            customButtons={[
              {
                icon: RefreshCw,
                onClick: () => console.log('Custom action'),
                text: 'Custom Action',
                variant: 'purple',
                title: 'Custom button'
              }
            ]}
          />
        </div>
      </div>

      {/* Method 2: Using individual ActionButtons */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Method 2: Individual ActionButtons</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-row gap-3">
            <ActionButtons.Refresh 
              onClick={handleRefresh}
              loading={loading}
            />
            
            <ActionButtons.Export 
              onClick={handleExport}
              text="Download CSV"
            />
            
            <ActionButtons.MonthYear 
              onClick={handleMonthYearClick}
              text={`${months[selectedMonth]} ${selectedYear}`}
            />
            
            <ActionButtons.Add 
              onClick={() => console.log('Adding new item')}
              text="Add Stock"
              variant="green"
            />
          </div>
        </div>
      </div>

      {/* Method 3: Using base OutlineActionButton for custom buttons */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Method 3: Custom OutlineActionButton</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-row gap-3">
            <OutlineActionButton
              onClick={handleRefresh}
              icon={RefreshCw}
              loading={loading}
              title="Refresh all data"
              variant="blue"
              iconOnly
            />
            
            <OutlineActionButton
              onClick={handleMonthYearClick}
              icon={Calendar}
              title="Select month and year"
              variant="purple"
              size="lg"
            >
              <span className="hidden sm:inline">{months[selectedMonth]} {selectedYear}</span>
              <span className="sm:hidden">{months[selectedMonth].slice(0, 3)} {selectedYear}</span>
            </OutlineActionButton>
          </div>
        </div>
      </div>

      {/* Table action buttons example */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Table Action Buttons</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <ActionButtons.View onClick={() => console.log('View item')} />
            <ActionButtons.Edit onClick={() => console.log('Edit item')} />
            <ActionButtons.Delete onClick={() => console.log('Delete item')} />
          </div>
        </div>
      </div>

      {/* Different sizes and variants */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Different Sizes and Variants</h2>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Small Size</h3>
            <HeaderActionButtons
              onRefresh={handleRefresh}
              refreshLoading={loading}
              onExport={handleExport}
              size="sm"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Medium Size (Default)</h3>
            <HeaderActionButtons
              onRefresh={handleRefresh}
              refreshLoading={loading}
              onExport={handleExport}
              size="md"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Large Size</h3>
            <HeaderActionButtons
              onRefresh={handleRefresh}
              refreshLoading={loading}
              onExport={handleExport}
              size="lg"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Different Color Variants</h3>
            <div className="flex flex-wrap gap-2">
              <ActionButtons.Add onClick={() => {}} text="Green" variant="green" />
              <OutlineActionButton onClick={() => {}} icon={RefreshCw} variant="blue">Blue</OutlineActionButton>
              <OutlineActionButton onClick={() => {}} icon={RefreshCw} variant="purple">Purple</OutlineActionButton>
              <OutlineActionButton onClick={() => {}} icon={RefreshCw} variant="orange">Orange</OutlineActionButton>
              <OutlineActionButton onClick={() => {}} icon={RefreshCw} variant="red">Red</OutlineActionButton>
              <OutlineActionButton onClick={() => {}} icon={RefreshCw} variant="gray">Gray</OutlineActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;
