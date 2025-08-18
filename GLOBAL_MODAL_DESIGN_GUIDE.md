# Global CRM Modal/Dialog Design System Guide

## Overview
A comprehensive, reusable modal design system extracted from the PatientList view dialog and SupplierManagement edit dialog. This system provides professional, responsive modal components and edit forms that can be used across all CRM pages.

## CSS File Location
`src/styles/global-modal-design.css`

## Core Components

### 1. Modal Structure

#### Basic Modal Setup
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="crm-modal-container">
    <DialogHeader className="crm-modal-header">
      <div className="crm-modal-header-content">
        {/* Header content */}
      </div>
    </DialogHeader>
    
    <div className="crm-modal-body">
      <div className="crm-modal-content">
        {/* Main content */}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### 2. Edit Form Modal Structure

#### Edit Form Dialog Setup
```tsx
<Dialog open={isEditing} onOpenChange={setIsEditing}>
  <DialogContent className="crm-edit-modal-container">
    <DialogHeader className="crm-edit-form-header">
      <div className="crm-edit-form-header-content">
        <div className="crm-edit-form-icon">
          <Edit2 className="h-5 w-5 crm-edit-form-icon-edit" />
        </div>
        <div>
          <DialogTitle className="crm-edit-form-title">
            Edit Item
          </DialogTitle>
          <DialogDescription className="crm-edit-form-description">
            Update the information below
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
    
    <form className="crm-edit-form">
      <div className="crm-edit-form-grid">
        {/* Form fields */}
      </div>
      
      <div className="crm-edit-form-footer">
        {/* Form buttons */}
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### 2. Header Components

#### Header with Photo/Avatar
```tsx
<div className="crm-modal-header-content">
  <div className="crm-modal-header-photo">
    <img 
      src={photoUrl} 
      alt="Profile"
      className="crm-modal-header-avatar" 
    />
    <Badge className="crm-modal-header-badge">
      Active
    </Badge>
  </div>
  <div className="crm-modal-header-text">
    <DialogTitle className="crm-modal-title">
      <Users className="crm-modal-title-icon" />
      Patient Name
    </DialogTitle>
    <DialogDescription className="crm-modal-description">
      ID: P0001 • Complete Medical Profile
    </DialogDescription>
  </div>
</div>
```

### 6. Content Sections

#### Basic Section
```tsx
<div className="crm-modal-section crm-modal-section-blue">
  <h3 className="crm-modal-section-header">
    <div className="crm-modal-section-icon crm-modal-section-icon-blue">
      <Users className="h-3 w-3 text-blue-600" />
    </div>
    Personal Information
  </h3>
  
  <div className="crm-modal-card-grid">
    {/* Information cards */}
  </div>
</div>
```

#### Information Cards
```tsx
<div className="crm-modal-info-card crm-modal-info-card-blue">
  <div className="crm-modal-card-content">
    <div className="crm-modal-card-icon crm-modal-card-icon-blue">
      <Users className="h-3 w-3 text-blue-600" />
    </div>
    <div className="crm-modal-card-text">
      <label className="crm-modal-card-label crm-modal-card-label-blue">
        Full Name
      </label>
      <p className="crm-modal-card-value">John Doe</p>
    </div>
  </div>
</div>
```

### 7. Special Sections

#### Form Fields
```tsx
<div className="crm-edit-form-grid">
  {/* Text Input */}
  <div className="crm-edit-form-field">
    <Label className="crm-edit-form-label crm-edit-form-label-required">
      Company Name
    </Label>
    <Input
      className="crm-edit-form-input"
      placeholder="Enter company name"
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
    />
  </div>

  {/* Textarea */}
  <div className="crm-edit-form-field crm-edit-form-grid-full">
    <Label className="crm-edit-form-label">Address</Label>
    <Textarea
      className="crm-edit-form-textarea"
      placeholder="Enter address"
      rows={3}
      value={formData.address}
      onChange={(e) => setFormData({...formData, address: e.target.value})}
    />
  </div>

  {/* Select Dropdown */}
  <div className="crm-edit-form-field">
    <Label className="crm-edit-form-label">Status</Label>
    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
      <SelectTrigger className="crm-edit-form-select">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

#### Form Footer with Actions
```tsx
<div className="crm-edit-form-footer">
  <Button 
    type="button"
    className="crm-edit-form-btn crm-edit-form-btn-cancel"
    onClick={() => setIsEditing(false)}
  >
    Cancel
  </Button>
  <Button 
    type="submit"
    className="crm-edit-form-btn crm-edit-form-btn-primary"
    disabled={submitting}
  >
    {submitting ? (
      <>
        <RefreshCw className="h-4 w-4 mr-2 crm-edit-form-btn-spinner" />
        Updating...
      </>
    ) : (
      'Update Item'
    )}
  </Button>
</div>
```

### 4. Delete Confirmation Dialog

#### Delete Dialog Structure
```tsx
<Dialog open={showDelete} onOpenChange={setShowDelete}>
  <DialogContent className="crm-delete-modal-container">
    <DialogHeader className="crm-delete-form-header">
      <div className="crm-delete-form-icon">
        <Trash2 className="crm-delete-form-icon-danger" />
      </div>
      <DialogTitle className="crm-delete-form-title">
        Delete Item
      </DialogTitle>
      <DialogDescription className="crm-delete-form-description">
        Are you sure you want to delete this item? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    
    {/* Preview card */}
    <div className="crm-delete-preview-card">
      <div className="crm-delete-preview-content">
        <div className="crm-delete-preview-title">Item Name</div>
        <div className="crm-delete-preview-detail">Contact: John Doe</div>
        <div className="crm-delete-preview-detail">Email: john@example.com</div>
        <div className="crm-delete-preview-detail crm-delete-preview-status">active</div>
      </div>
    </div>

    <div className="crm-edit-form-footer">
      <Button 
        type="button"
        className="crm-edit-form-btn crm-edit-form-btn-cancel"
        onClick={() => setShowDelete(false)}
      >
        Cancel
      </Button>
      <Button 
        type="button"
        className="crm-edit-form-btn crm-edit-form-btn-danger"
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 5. Form Validation States

#### Error States
```tsx
<div className="crm-edit-form-field">
  <Label className="crm-edit-form-label crm-edit-form-label-required">
    Email
  </Label>
  <Input
    className="crm-edit-form-input crm-edit-form-input-error"
    placeholder="Enter email"
    value={formData.email}
    onChange={(e) => setFormData({...formData, email: e.target.value})}
  />
  <p className="crm-edit-form-error-message">
    Please enter a valid email address
  </p>
</div>
```

#### Success States
```tsx
<div className="crm-edit-form-field">
  <Label className="crm-edit-form-label">
    Phone
  </Label>
  <Input
    className="crm-edit-form-input crm-edit-form-input-success"
    placeholder="Enter phone"
    value={formData.phone}
    onChange={(e) => setFormData({...formData, phone: e.target.value})}
  />
  <p className="crm-edit-form-help-text">
    Phone number is valid
  </p>
</div>
```

#### Basic Section
```tsx
<div className="crm-modal-section crm-modal-section-blue">
  <h3 className="crm-modal-section-header">
    <div className="crm-modal-section-icon crm-modal-section-icon-blue">
      <Users className="h-3 w-3 text-blue-600" />
    </div>
    Personal Information
  </h3>
  
  <div className="crm-modal-card-grid">
    {/* Information cards */}
  </div>
</div>
```

#### Information Cards
```tsx
<div className="crm-modal-info-card crm-modal-info-card-blue">
  <div className="crm-modal-card-content">
    <div className="crm-modal-card-icon crm-modal-card-icon-blue">
      <Users className="h-3 w-3 text-blue-600" />
    </div>
    <div className="crm-modal-card-text">
      <label className="crm-modal-card-label crm-modal-card-label-blue">
        Full Name
      </label>
      <p className="crm-modal-card-value">John Doe</p>
    </div>
  </div>
</div>
```

### 4. Special Sections

#### Payment Information Section
```tsx
<div className="crm-modal-payment-section">
  <div className="crm-modal-payment-header">
    <div className="crm-modal-payment-icon">
      <span className="text-white text-sm">💰</span>
    </div>
    <div>
      <h3 className="crm-modal-payment-title">
        Payment Information
      </h3>
      <p className="crm-modal-payment-subtitle">
        Financial details and billing information
      </p>
    </div>
  </div>

  <div className="crm-modal-card-grid">
    <div className="crm-modal-payment-card">
      {/* Payment card content */}
    </div>
    <div className="crm-modal-payment-card crm-modal-payment-card-highlight">
      {/* Highlighted payment card */}
    </div>
  </div>
</div>
```

## Color Variants

### Form Icon Types
- `crm-edit-form-icon-edit` - Blue theme (editing items)
- `crm-edit-form-icon-add` - Green theme (adding new items)
- `crm-edit-form-icon-delete` - Red theme (delete confirmations)

### Form Button Types
- `crm-edit-form-btn-cancel` - White/gray theme (cancel actions)
- `crm-edit-form-btn-primary` - Blue gradient theme (primary actions)
- `crm-edit-form-btn-danger` - Red gradient theme (delete actions)

### Form Input States
- `crm-edit-form-input` - Default state
- `crm-edit-form-input-error` - Error state (red border/shadow)
- `crm-edit-form-input-success` - Success state (green border/shadow)
- `crm-edit-form-textarea-error` - Textarea error state
- `crm-edit-form-textarea-success` - Textarea success state
- `crm-edit-form-select-error` - Select error state
- `crm-edit-form-select-success` - Select success state

### Section Colors
- `crm-modal-section-blue` - Blue theme (personal info)
- `crm-modal-section-green` - Green theme (contact info)
- `crm-modal-section-red` - Red theme (medical info)
- `crm-modal-section-purple` - Purple theme (documents)
- `crm-modal-section-orange` - Orange theme (general)
- `crm-modal-section-amber` - Amber theme (special sections)

### Card Colors
- `crm-modal-info-card-blue` + `crm-modal-card-icon-blue` + `crm-modal-card-label-blue`
- `crm-modal-info-card-green` + `crm-modal-card-icon-green` + `crm-modal-card-label-green`
- `crm-modal-info-card-red` + `crm-modal-card-icon-red` + `crm-modal-card-label-red`
- `crm-modal-info-card-purple` + `crm-modal-card-icon-purple` + `crm-modal-card-label-purple`
- `crm-modal-info-card-orange` + `crm-modal-card-icon-orange` + `crm-modal-card-label-orange`
- `crm-modal-info-card-amber` + `crm-modal-card-icon-amber` + `crm-modal-card-label-amber`
- `crm-modal-info-card-gray` + `crm-modal-card-icon-gray` + `crm-modal-card-label-gray`

### Special Payment Cards
- `crm-modal-payment-card` - Standard payment card
- `crm-modal-payment-card-highlight` - Highlighted (purple gradient)
- `crm-modal-payment-card-success` - Success state (green gradient)
- `crm-modal-payment-card-warning` - Warning state (red gradient)

## Responsive Design

### Breakpoints
- **Mobile**: Base styles (< 640px)
- **Small**: sm (≥ 640px)
- **Medium**: md (≥ 768px)  
- **Large**: lg (≥ 1024px)

### Responsive Features
- **Header Avatar**: Scales from 2.5rem to 5rem
- **Section Icons**: Scales from 1.25rem to 2rem
- **Card Icons**: Scales from 1.5rem to 2.5rem
- **Typography**: Scales from 0.75rem to 1.875rem
- **Spacing**: Scales from 0.5rem to 2rem
- **Grid Layout**: 1 column → 2 columns → 3 columns

## Usage Examples

### Complete Edit Form Modal (Based on SupplierManagement)
```tsx
// State management
const [isEditing, setIsEditing] = useState(false);
const [editingItem, setEditingItem] = useState(null);
const [formData, setFormData] = useState({
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  status: 'active'
});

// Edit form dialog
<Dialog open={isEditing} onOpenChange={setIsEditing}>
  <DialogContent className="crm-edit-modal-container">
    <DialogHeader className="crm-edit-form-header">
      <div className="crm-edit-form-header-content">
        <div className="crm-edit-form-icon">
          {editingItem ? 
            <Edit2 className="h-5 w-5 crm-edit-form-icon-edit" /> : 
            <Plus className="h-5 w-5 crm-edit-form-icon-add" />
          }
        </div>
        <div>
          <DialogTitle className="crm-edit-form-title">
            {editingItem ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogDescription className="crm-edit-form-description">
            {editingItem ? 'Update supplier information' : 'Enter the details for the new supplier'}
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
    
    <form 
      onSubmit={handleSubmit}
      className="crm-edit-form"
    >
      <div className="crm-edit-form-grid">
        {/* Company Name */}
        <div className="crm-edit-form-field">
          <Label className="crm-edit-form-label crm-edit-form-label-required">
            Company Name
          </Label>
          <Input
            className="crm-edit-form-input"
            placeholder="Enter company name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        {/* Contact Person */}
        <div className="crm-edit-form-field">
          <Label className="crm-edit-form-label crm-edit-form-label-required">
            Contact Person
          </Label>
          <Input
            className="crm-edit-form-input"
            placeholder="Enter contact person name"
            value={formData.contact_person}
            onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
            required
          />
        </div>

        {/* Email */}
        <div className="crm-edit-form-field">
          <Label className="crm-edit-form-label crm-edit-form-label-required">
            Email
          </Label>
          <Input
            type="email"
            className="crm-edit-form-input"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        {/* Phone */}
        <div className="crm-edit-form-field">
          <Label className="crm-edit-form-label crm-edit-form-label-required">
            Phone
          </Label>
          <Input
            className="crm-edit-form-input"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>

        {/* Address - Full Width */}
        <div className="crm-edit-form-field crm-edit-form-grid-full">
          <Label className="crm-edit-form-label">
            Address
          </Label>
          <Textarea
            className="crm-edit-form-textarea"
            placeholder="Enter company address"
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        {/* Status */}
        <div className="crm-edit-form-field">
          <Label className="crm-edit-form-label">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger className="crm-edit-form-select">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="crm-edit-form-footer">
        <Button 
          type="button"
          className="crm-edit-form-btn crm-edit-form-btn-cancel"
          onClick={() => {
            setIsEditing(false);
            setEditingItem(null);
            setFormData({
              name: '',
              contact_person: '',
              email: '',
              phone: '',
              address: '',
              status: 'active'
            });
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="crm-edit-form-btn crm-edit-form-btn-primary"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 crm-edit-form-btn-spinner" />
              {editingItem ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            editingItem ? 'Update Supplier' : 'Add Supplier'
          )}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### Complete Delete Confirmation Modal
```tsx
// Delete confirmation dialog
<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <DialogContent className="crm-delete-modal-container">
    <DialogHeader className="crm-delete-form-header">
      <div className="crm-delete-form-icon">
        <Trash2 className="crm-delete-form-icon-danger" />
      </div>
      <DialogTitle className="crm-delete-form-title">
        Delete Supplier
      </DialogTitle>
      <DialogDescription className="crm-delete-form-description">
        Are you sure you want to delete this supplier? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    
    {itemToDelete && (
      <div className="crm-delete-preview-card">
        <div className="crm-delete-preview-content">
          <div className="crm-delete-preview-title">{itemToDelete.name}</div>
          <div className="crm-delete-preview-detail">{itemToDelete.contact_person}</div>
          <div className="crm-delete-preview-detail">{itemToDelete.email}</div>
          <div className="crm-delete-preview-detail crm-delete-preview-status">{itemToDelete.status}</div>
        </div>
      </div>
    )}

    <div className="crm-edit-form-footer">
      <Button 
        type="button"
        className="crm-edit-form-btn crm-edit-form-btn-cancel"
        onClick={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button 
        type="button"
        className="crm-edit-form-btn crm-edit-form-btn-danger"
        onClick={handleConfirmDelete}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 crm-edit-form-btn-spinner" />
            Deleting...
          </>
        ) : (
          'Delete'
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Patient Information Modal
```tsx
<Dialog open={showPatient} onOpenChange={setShowPatient}>
  <DialogContent className="crm-modal-container">
    <DialogHeader className="crm-modal-header">
      <div className="crm-modal-header-content">
        <div className="crm-modal-header-photo">
          <img src={patient.photo} className="crm-modal-header-avatar" />
          <Badge className="crm-modal-header-badge">Active</Badge>
        </div>
        <div className="crm-modal-header-text">
          <DialogTitle className="crm-modal-title">
            <Users className="crm-modal-title-icon" />
            {patient.name}
          </DialogTitle>
          <DialogDescription className="crm-modal-description">
            ID: {patient.id} • Complete Medical Profile
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
    
    <div className="crm-modal-body">
      <div className="crm-modal-content">
        {/* Personal Information Section */}
        <div className="crm-modal-section crm-modal-section-blue">
          <h3 className="crm-modal-section-header">
            <div className="crm-modal-section-icon crm-modal-section-icon-blue">
              <Users className="h-3 w-3 text-blue-600" />
            </div>
            Personal Information
          </h3>
          
          <div className="crm-modal-card-grid">
            <div className="crm-modal-info-card crm-modal-info-card-blue">
              <div className="crm-modal-card-content">
                <div className="crm-modal-card-icon crm-modal-card-icon-blue">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
                <div className="crm-modal-card-text">
                  <label className="crm-modal-card-label crm-modal-card-label-blue">
                    Full Name
                  </label>
                  <p className="crm-modal-card-value">{patient.name}</p>
                </div>
              </div>
            </div>
            
            <div className="crm-modal-info-card crm-modal-info-card-green">
              <div className="crm-modal-card-content">
                <div className="crm-modal-card-icon crm-modal-card-icon-green">
                  <span className="text-green-600 font-bold text-xs">{patient.age}</span>
                </div>
                <div className="crm-modal-card-text">
                  <label className="crm-modal-card-label crm-modal-card-label-green">
                    Age & Gender
                  </label>
                  <p className="crm-modal-card-value">{patient.age} years • {patient.gender}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Information Section */}
        <div className="crm-modal-payment-section">
          <div className="crm-modal-payment-header">
            <div className="crm-modal-payment-icon">
              <span className="text-white text-sm">💰</span>
            </div>
            <div>
              <h3 className="crm-modal-payment-title">
                Payment Information
              </h3>
              <p className="crm-modal-payment-subtitle">
                Financial details and billing information
              </p>
            </div>
          </div>

          <div className="crm-modal-card-grid">
            <div className="crm-modal-payment-card">
              <div className="crm-modal-card-content">
                <div className="crm-modal-card-icon crm-modal-card-icon-blue">
                  <span className="text-blue-600 text-xs">🏥</span>
                </div>
                <div className="crm-modal-card-text">
                  <label className="crm-modal-card-label crm-modal-card-label-blue">
                    Consultation Fees
                  </label>
                  <p className="crm-modal-card-value">₹{patient.fees}</p>
                </div>
              </div>
            </div>
            
            <div className="crm-modal-payment-card crm-modal-payment-card-highlight">
              <div className="crm-modal-card-content">
                <div className="crm-modal-card-icon crm-modal-card-icon-purple">
                  <span className="text-white text-xs">📊</span>
                </div>
                <div className="crm-modal-card-text">
                  <label className="crm-modal-card-label crm-modal-card-label-purple">
                    Total Amount
                  </label>
                  <p className="crm-modal-card-value">₹{patient.totalAmount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## Features

### ✅ Professional Design
- Gradient backgrounds with backdrop blur
- Smooth animations and transitions
- Professional shadow system
- Color-coded sections and forms

### ✅ Comprehensive Form System
- Professional edit form layouts
- Form validation states (error/success)
- Delete confirmation dialogs
- Loading states with spinners
- Responsive grid layouts

### ✅ Responsive Layout
- Mobile-first design approach
- Adaptive grid layouts (1→2 columns for forms)
- Responsive typography and spacing
- Scalable icons and form elements

### ✅ Form Features
- Required field indicators (*)
- Input validation styling
- Help text and error messages
- Full-width and half-width fields
- Textarea and select support

### ✅ Action Dialogs
- Edit/Add form modals
- Delete confirmation dialogs
- Preview cards for delete actions
- Professional button styling

### ✅ Accessibility
- Proper semantic structure
- High contrast colors
- Focus management
- Screen reader friendly
- Keyboard navigation support

### ✅ Customizable
- Multiple color variants
- Flexible layout options
- Extensible component system
- Easy to theme
- Form validation states

### ✅ Performance
- CSS-only animations
- Optimized for modern browsers
- Minimal JavaScript requirements
- Efficient rendering

## Integration

1. **Import the CSS file** in your main stylesheet or component:
   ```css
   @import 'src/styles/global-modal-design.css';
   ```

2. **Use the class structure** as shown in the examples above

3. **Choose the right modal type**:
   - Use `crm-modal-container` for view/information modals
   - Use `crm-edit-modal-container` for edit/add forms
   - Use `crm-delete-modal-container` for delete confirmations

4. **Form Integration**:
   - Use `crm-edit-form-grid` for responsive form layouts
   - Apply validation classes (`crm-edit-form-input-error`, `crm-edit-form-input-success`)
   - Use `crm-edit-form-grid-full` for full-width fields

5. **Customize colors** by modifying the CSS variables or creating new variants

6. **Extend components** by adding new section types or form field variants

## Modal Types Summary

| Modal Type | Use Case | Container Class | Best For |
|------------|----------|-----------------|----------|
| **View Modal** | Display information | `crm-modal-container` | Patient details, item previews |
| **Edit Modal** | Forms and editing | `crm-edit-modal-container` | Add/edit suppliers, patients, etc. |
| **Delete Modal** | Confirmations | `crm-delete-modal-container` | Delete confirmations with preview |

## Form Layout Patterns

| Pattern | Class | Description |
|---------|-------|-------------|
| **Two-column form** | `crm-edit-form-grid` | Standard responsive grid (1→2 columns) |
| **Full-width field** | `crm-edit-form-grid-full` | Spans entire row (addresses, descriptions) |
| **Required field** | `crm-edit-form-label-required` | Adds red asterisk (*) automatically |
| **Field validation** | `crm-edit-form-input-error` | Red border and shadow for errors |

This comprehensive design system provides everything needed for professional modal dialogs and forms throughout the CRM application, ensuring consistency and excellent user experience across all pages.
