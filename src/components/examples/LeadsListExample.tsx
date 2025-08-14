import React, { useState, useEffect } from 'react';
import { ActionButtonContainer, useCommonActions, ActionButton } from '@/components/ui/ActionButtonContainer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Example implementation for LeadsList using the new ActionButtonContainer
const LeadsListExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showMonthDialog, setShowMonthDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('August 2025');
  
  const { createRefreshAction, createExportAction, createAddAction, createDateSelectorAction, createClearFilterAction } = useCommonActions();

  // Example handlers
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Data refreshed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export logic here
    toast({
      title: "Success",
      description: "Exporting data..."
    });
  };

  const handleAdd = () => {
    setShowAddDialog(true);
  };

  const handleDateSelector = () => {
    setShowMonthDialog(true);
  };

  const handleClearFilters = () => {
    setHasFilters(false);
    setCurrentMonth('August 2025');
  };

  // Create action buttons configuration
  const actionButtons: ActionButton[] = [
    createRefreshAction(handleRefresh, loading),
    createDateSelectorAction(handleDateSelector, currentMonth),
    createExportAction(handleExport),
    ...(hasFilters ? [createClearFilterAction(handleClearFilters)] : []),
    createAddAction(handleAdd, 'Add Lead')
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Leads Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and track your sales leads efficiently
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            {/* This is the reusable action button container */}
            <ActionButtonContainer 
              title="Leads List"
              buttons={actionButtons}
              className="w-full"
            />
          </CardHeader>

          <CardContent>
            {/* Your table/content would go here */}
            <div className="text-center py-12">
              <p className="text-gray-500">Your leads table content would go here...</p>
              <div className="mt-4 space-y-2">
                <button 
                  onClick={() => setHasFilters(!hasFilters)}
                  className="text-blue-600 underline"
                >
                  {hasFilters ? 'Remove' : 'Add'} Filters (to test clear button)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadsListExample;
