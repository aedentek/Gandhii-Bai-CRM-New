# New Global Delete Design Standard

## Overview
Based on the successful implementation in Lead Categories and now applied to Role Management, this is the new standard design for all delete confirmation dialogs across the CRM system.

## Design Features

### 1. **Icon-Title Container Structure**
```tsx
<DialogHeader className="editpopup form dialog-header">
  <div className="editpopup form icon-title-container">
    <div className="editpopup form dialog-icon">
      <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
    </div>
    <div className="editpopup form title-description">
      <DialogTitle className="editpopup form dialog-title text-red-700">
        Delete [Entity Name]
      </DialogTitle>
      <DialogDescription className="editpopup form dialog-description">
        Are you sure you want to delete this [entity]? This action cannot be undone.
      </DialogDescription>
    </div>
  </div>
</DialogHeader>
```

### 2. **Entity Details Section**
```tsx
{entityToDelete && (
  <div className="mx-4 my-4 p-4 bg-gray-50 rounded-lg border">
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <ContextualIcon className="h-4 w-4 text-gray-500" />
        <span className="font-medium text-gray-900">{entityToDelete.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">{entityToDelete.description || 'No description'}</span>
      </div>
      {/* Additional contextual details */}
    </div>
  </div>
)}
```

### 3. **Professional Footer Buttons**
```tsx
<DialogFooter className="editpopup form dialog-footer flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
  <Button 
    type="button" 
    variant="outline" 
    onClick={() => {
      setShowDeleteDialog(false);
      setEntityToDelete(null);
    }}
    disabled={submitting}
    className="editpopup form footer-button-cancel w-full sm:w-auto modern-btn modern-btn-secondary"
  >
    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
    Cancel
  </Button>
  <Button 
    type="button" 
    onClick={handleDeleteEntity}
    disabled={submitting}
    className="editpopup form footer-button-delete w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
  >
    {submitting ? (
      <>
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        Deleting...
      </>
    ) : (
      <>
        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
        Delete [Entity]
      </>
    )}
  </Button>
</DialogFooter>
```

## Required State Variables
```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [entityToDelete, setEntityToDelete] = useState<EntityType | null>(null);
```

## Required Functions
```tsx
// Show delete dialog
const handleDeleteClick = (entity: EntityType) => {
  setEntityToDelete(entity);
  setShowDeleteDialog(true);
};

// Perform deletion
const handleDeleteEntity = async () => {
  if (!entityToDelete) return;

  try {
    setSubmitting(true);
    const res = await fetch(`/api/endpoint/${entityToDelete.id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete entity');

    toast({
      title: "Success",
      description: "Entity deleted successfully"
    });

    // Close dialog and refresh data
    setShowDeleteDialog(false);
    setEntityToDelete(null);
    // Refresh or reload data
  } catch (error) {
    console.error('Error deleting entity:', error);
    toast({
      title: "Error",
      description: "Failed to delete entity",
      variant: "destructive"
    });
  } finally {
    setSubmitting(false);
  }
};
```

## Contextual Icons by Entity Type

### For User/Role Management
- **Primary**: `Shield` (role name)
- **Description**: `FileText` 
- **Permissions**: `Settings`
- **Status**: `Activity`

### For Categories  
- **Primary**: `FolderOpen` or `Tag`
- **Description**: `FileText`
- **Status**: `Activity`
- **Date**: `Calendar`

### For Staff/Doctor Management
- **Primary**: `User` (name)
- **Contact**: `Phone`
- **Amount**: `DollarSign`
- **Date**: `Calendar`
- **Details**: `FileText`

### For Medicine/Inventory
- **Primary**: `Package` (product name)
- **Category**: `FolderOpen`
- **Price**: `DollarSign`
- **Stock**: `BarChart3`
- **Date**: `Calendar`

## Key Design Principles

1. **Consistent Red Theme**: Trash2 icon and title in red (`text-red-600`, `text-red-700`)
2. **Gray Details Section**: `bg-gray-50 rounded-lg border` for entity details
3. **Contextual Icons**: Use meaningful icons that represent the data being shown
4. **Loading States**: Show spinner and "Deleting..." text during submission
5. **Professional Spacing**: Consistent padding and gaps using Tailwind classes
6. **Responsive Design**: Works on mobile with `w-full sm:w-auto` button sizing

## Implementation Checklist

- [ ] Add required state variables
- [ ] Create `handleDeleteClick` function
- [ ] Update `handleDeleteEntity` function
- [ ] Update delete button to use `handleDeleteClick`
- [ ] Add delete dialog with proper structure
- [ ] Include contextual entity details
- [ ] Test delete functionality
- [ ] Verify responsive design

## Successfully Implemented In:
- ✅ Lead Categories (Original design)
- ✅ Role Management (Latest implementation)
- ✅ Staff Advance Management
- ✅ Staff Categories Management

## Next Implementation Targets:
- [ ] Medicine Management
- [ ] Grocery Management  
- [ ] General Purchase Management
- [ ] Doctor Management (update existing to this new standard)
- [ ] User Management
- [ ] All other management pages

---

**Note**: This design replaces the basic `window.confirm()` dialogs and provides a much more professional, informative, and user-friendly deletion experience.
