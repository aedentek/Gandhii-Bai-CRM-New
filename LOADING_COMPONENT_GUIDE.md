# Loading Component Usage Guide

This guide shows how to use the reusable LoadingScreen and LoadingSpinner components across your application.

## Components Available

### 1. LoadingScreen (Full Page Loading)
Use this for full-page loading states when fetching initial data.

### 2. LoadingSpinner (Inline Loading)
Use this for smaller loading states within components or buttons.

## How to Use in Any Page

### Step 1: Import the Component
```tsx
import LoadingScreen from '@/components/shared/LoadingScreen';
// OR
import { LoadingSpinner } from '@/components/shared';
```

### Step 2: Add Loading State
```tsx
const [loading, setLoading] = useState(true);
```

### Step 3: Set Loading in Data Fetch Functions
```tsx
const fetchData = async () => {
  try {
    setLoading(true);
    // Your API call here
    const response = await fetch('your-api-endpoint');
    const data = await response.json();
    // Handle data
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false); // Always stop loading
  }
};
```

### Step 4: Add Loading Check in Render
```tsx
if (loading) {
  return <LoadingScreen message="Loading your data..." />;
}

return (
  // Your normal component JSX
);
```

## Complete Example

```tsx
import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/shared/LoadingScreen';

const MyComponent: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/your-endpoint');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading data..." />;
  }

  return (
    <div>
      {/* Your component content */}
    </div>
  );
};
```

## LoadingScreen Props

```tsx
interface LoadingScreenProps {
  message?: string;        // Custom loading message
  size?: 'small' | 'medium' | 'large';  // Spinner size
  className?: string;      // Additional CSS classes
}
```

## LoadingSpinner Props

```tsx
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'green' | 'red' | 'purple' | 'orange';
  className?: string;
}
```

## Examples of Usage

### Full Page Loading
```tsx
<LoadingScreen message="Loading roles..." />
<LoadingScreen message="Loading user data..." size="large" />
```

### Inline Loading in Buttons
```tsx
<Button disabled={submitting}>
  {submitting ? (
    <>
      <LoadingSpinner size="sm" color="white" className="mr-2" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>
```

### Loading in Table Cells
```tsx
<TableCell>
  {loading ? (
    <LoadingSpinner size="xs" />
  ) : (
    data.value
  )}
</TableCell>
```

## Pages Already Updated

✅ RoleManagement.tsx - Uses LoadingScreen for full page loading
✅ GeneralManagement.tsx - Uses LoadingScreen for full page loading  
✅ UserManagement.tsx - Uses LoadingScreen for full page loading

## Pages You Can Update Next

- DoctorManagement.tsx
- StaffManagement.tsx
- MedicineManagement.tsx
- GroceryManagement.tsx
- CategoryManagement.tsx
- And any other pages with loading states

## Quick Migration Pattern

1. Add import: `import LoadingScreen from '@/components/shared/LoadingScreen';`
2. Replace existing loading JSX with: `<LoadingScreen message="Loading..." />`
3. Update API endpoints from port 4001 to 4000 if needed
4. Test the loading behavior

That's it! The LoadingScreen component will provide a consistent, beautiful loading experience across your entire application.
