# Glass Morphism Modal Design Template

## Complete Implementation Guide for CRM Modal Design

### 1. Modal Container Structure

```tsx
{/* Main Modal Overlay */}
<div 
  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  onClick={handleCloseModal}
>
  {/* Modal Content Container */}
  <div 
    className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Modal Content Goes Here */}
  </div>
</div>
```

### 2. Header Section Design

```tsx
{/* Modal Header */}
<div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
  {/* Gradient Top Bar */}
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
  
  {/* Header Content */}
  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
    
    {/* Avatar Section */}
    <div className="relative flex-shrink-0">
      <Avatar className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg">
        <AvatarImage src={profileImage} />
        <AvatarFallback className="bg-blue-100 text-blue-600">
          {initials}
        </AvatarFallback>
      </Avatar>
      {/* Status Badge */}
      <div className="absolute -bottom-1 -right-1">
        <Badge className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs">
          Active
        </Badge>
      </div>
    </div>
    
    {/* Title and Info Section */}
    <div className="flex-1 min-w-0">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
        <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
        <span className="truncate">Modal Title</span>
      </h2>
      <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
        <span className="text-gray-600">Subtitle Info:</span>
        <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
          Highlighted Value
        </span>
      </div>
    </div>
    
    {/* Close Button */}
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCloseModal}
      className="text-slate-500 hover:text-slate-700"
    >
      <X className="h-5 w-5" />
    </Button>
  </div>
</div>
```

### 3. Body Content Area

```tsx
{/* Modal Body */}
<div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
  <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
    
    {/* Information Section */}
    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <User className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
        </div>
        Section Title
      </h3>
      
      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        
        {/* Blue Information Card */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Label</div>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">Value</p>
            </div>
          </div>
        </div>
        
        {/* Green Information Card */}
        <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-green-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold text-xs sm:text-sm">ID</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-green-600 uppercase tracking-wide">ID Number</div>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Value</p>
            </div>
          </div>
        </div>
        
        {/* Purple Information Card */}
        <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Category</div>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Value</p>
            </div>
          </div>
        </div>
        
        {/* Orange Information Card */}
        <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-orange-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Amount</div>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Value</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
    
    {/* Additional Content Sections */}
    {/* Repeat the same structure for more sections */}
    
  </div>
</div>
```

### 4. Table Section Design (if needed)

```tsx
{/* Table Section */}
<div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blue-100 shadow-sm">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
      <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center">
        <DollarSign className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600" />
      </div>
      Data Records ({recordCount})
    </h3>
  </div>
  
  <div className="overflow-x-auto">
    <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
      <thead>
        <tr className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white">
          <th className="px-4 py-3 text-left text-sm font-semibold">S No</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Column 1</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Column 2</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Column 3</th>
          <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((item, index) => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
            <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.column1}</td>
            <td className="px-4 py-3 text-sm text-gray-900">{item.column2}</td>
            <td className="px-4 py-3 text-sm">
              <Badge className="bg-green-100 text-green-800 font-semibold">
                {item.column3}
              </Badge>
            </td>
            <td className="px-4 py-3 text-center">
              <button className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 5. Required Imports

```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  X, 
  FileText, 
  DollarSign, 
  Calendar, 
  Trash2 
} from 'lucide-react';
```

### 6. Handler Functions

```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

const handleCloseModal = () => {
  setIsModalOpen(false);
  // Additional cleanup logic here
};

const handleOpenModal = () => {
  setIsModalOpen(true);
  // Additional setup logic here
};
```

### 7. CSS Classes (add to global styles if needed)

```css
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

### 8. Complete Modal Implementation Example

```tsx
{isModalOpen && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={handleCloseModal}
  >
    <div 
      className="max-w-[95vw] max-h-[95vh] w-full sm:max-w-6xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 m-4 rounded-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="relative pb-3 sm:pb-4 md:pb-6 border-b border-blue-100 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
          <div className="relative flex-shrink-0">
            <Avatar className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg">
              <AvatarImage src={data.photo} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {data.initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <Badge className="bg-green-100 text-green-800 border-2 border-white shadow-sm text-xs">
                Active
              </Badge>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
              <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
              <span className="truncate">{data.title}</span>
            </h2>
            <div className="text-xs sm:text-sm md:text-lg lg:text-xl mt-1 flex items-center gap-2">
              <span className="text-gray-600">{data.subtitle}:</span>
              <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                {data.value}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseModal}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-120px)] md:max-h-[calc(95vh-140px)] lg:max-h-[calc(95vh-200px)] custom-scrollbar">
        <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
          {/* Your content sections here */}
        </div>
      </div>
    </div>
  </div>
)}
```

### 9. Implementation Checklist

- [ ] Import required components and icons
- [ ] Set up modal state management
- [ ] Implement click-outside-to-close functionality
- [ ] Add responsive breakpoints (sm:, md:, lg:)
- [ ] Configure proper z-index for modal overlay
- [ ] Add custom scrollbar styles
- [ ] Implement gradient backgrounds and borders
- [ ] Set up proper spacing and padding
- [ ] Add hover effects and transitions
- [ ] Test on different screen sizes
- [ ] Ensure accessibility with proper focus management
- [ ] Add loading states if needed
- [ ] Implement proper error handling

### 10. Color Variants Available

**Blue Theme:** `from-blue-50 to-white`, `border-blue-100`, `text-blue-600`, `bg-blue-100`
**Green Theme:** `from-green-50 to-white`, `border-green-100`, `text-green-600`, `bg-green-100`
**Purple Theme:** `from-purple-50 to-white`, `border-purple-100`, `text-purple-600`, `bg-purple-100`
**Orange Theme:** `from-orange-50 to-white`, `border-orange-100`, `text-orange-600`, `bg-orange-100`

This template provides a complete, responsive, and modern glass morphism modal design that maintains consistency across your entire CRM application.
