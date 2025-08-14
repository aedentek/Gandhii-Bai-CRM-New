import React, { useState } from 'react';
import { ActionButtonContainer, useCommonActions, ActionButton } from '@/components/ui/ActionButtonContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Settings, Users, UserCheck, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Example implementation for Patient Management using the same ActionButtonContainer
const PatientManagementExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  
  const { createRefreshAction, createExportAction, createAddAction } = useCommonActions();

  // Custom action specific to patient management
  const createBulkAction = (onBulkAction: () => void, label: string, icon: any): ActionButton => ({
    id: 'bulk-action',
    label,
    variant: 'warning',
    onClick: onBulkAction,
    icon,
    disabled: selectedCount === 0,
    badge: selectedCount > 0 ? selectedCount : undefined
  });

  const createSettingsAction = (onSettings: () => void): ActionButton => ({
    id: 'settings',
    label: 'Settings',
    variant: 'clear',
    onClick: onSettings,
    icon: Settings
  });

  // Handlers
  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast({ title: "Success", description: "Patients data refreshed" });
  };

  const handleExport = () => {
    toast({ title: "Success", description: "Exporting patients data..." });
  };

  const handleAddPatient = () => {
    toast({ title: "Info", description: "Opening add patient form..." });
  };

  const handleBulkDelete = () => {
    if (selectedCount > 0) {
      toast({ 
        title: "Warning", 
        description: `Deleting ${selectedCount} selected patients...`,
        variant: "destructive"
      });
      setSelectedCount(0);
    }
  };

  const handleSettings = () => {
    toast({ title: "Info", description: "Opening patient settings..." });
  };

  // Different button configuration for patient management
  const patientActionButtons: ActionButton[] = [
    createRefreshAction(handleRefresh, loading),
    createExportAction(handleExport, 'Export Patients'),
    createSettingsAction(handleSettings),
    ...(selectedCount > 0 ? [createBulkAction(handleBulkDelete, 'Delete Selected', Trash2)] : []),
    createAddAction(handleAddPatient, 'Add Patient')
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Patient Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage patient records and information
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            {/* Same ActionButtonContainer component, different buttons */}
            <ActionButtonContainer 
              title="Patient Records"
              buttons={patientActionButtons}
              className="w-full"
            />
          </CardHeader>

          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500">Patient records table would go here...</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-400">Selected patients: {selectedCount}</p>
                <div className="space-x-2">
                  <button 
                    onClick={() => setSelectedCount(Math.max(0, selectedCount - 1))}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={selectedCount === 0}
                  >
                    Deselect One
                  </button>
                  <button 
                    onClick={() => setSelectedCount(selectedCount + 1)}
                    className="px-4 py-2 bg-blue-200 rounded hover:bg-blue-300"
                  >
                    Select One
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  (Try selecting patients to see the bulk delete button with badge)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientManagementExample;
