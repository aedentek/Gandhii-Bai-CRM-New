import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// List of component files that need the usePageTitle hook
const componentFiles = [
  // Patient Management
  'src/components/patients/AddPatient.tsx',
  'src/components/patients/PatientList.tsx',
  'src/components/patients/DeletedPatients.tsx',
  'src/components/patients/PatientAttendance.tsx',
  'src/components/patients/PatientHistory.tsx',
  'src/components/patients/PatientPaymentFees.tsx',
  'src/components/patients/PatientBiodata.tsx',
  'src/components/patients/PatientFullyHistory.tsx',
  'src/pages/management/test-report-amount.tsx',
  
  // Staff Management
  'src/components/management/AddDoctor.tsx',
  'src/components/management/DeletedDoctors.tsx',
  'src/components/management/DoctorAttendance.tsx',
  'src/components/management/DoctorSalary.tsx',
  'src/components/management/DoctorCategory.tsx',
  'src/components/management/StaffCategory.tsx',
  'src/components/management/AddStaff.tsx',
  'src/components/management/StaffManagement.tsx',
  'src/components/management/DeletedStaff.tsx',
  'src/components/management/DoctorManagement.tsx',
  'src/components/management/SupplierManagement.tsx',
  'src/components/management/GroceryManagement.tsx',
  'src/components/management/AttendanceManagement.tsx',
  'src/components/management/SalaryPayment.tsx',
  
  // Medicine Management
  'src/components/management/MedicineManagement.tsx',
  'src/components/management/MedicineCategories.tsx',
  'src/components/management/MedicineStock.tsx',
  'src/components/management/MedicineAccounts.tsx',
  
  // Grocery Management
  'src/components/management/GroceryCategories.tsx',
  'src/components/management/GrocerySuppliers.tsx',
  'src/components/management/GroceryStock.tsx',
  'src/components/management/GroceryAccounts.tsx',
  
  // General Management
  'src/components/management/GeneralManagement.tsx',
  'src/components/management/GeneralCategories.tsx',
  'src/components/management/GeneralSuppliers.tsx',
  'src/components/management/GeneralStock.tsx',
  'src/components/management/GeneralAccounts.tsx',
  
  // User Management
  'src/components/management/AddUser.tsx',
  'src/components/management/UserManagement.tsx',
  'src/components/management/AddRole.tsx',
  
  // Lead Management
  'src/components/leads/AddLeadCategory.tsx',
  
  // Settings
  'src/components/settings/Settings.tsx',
];

function addPageTitleToComponents() {
  console.log('🚀 Adding usePageTitle hook to all components...\n');
  
  componentFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check if usePageTitle is already imported
      if (content.includes("import usePageTitle from '@/hooks/usePageTitle'")) {
        console.log(`✅ ${filePath} - usePageTitle already imported`);
        return;
      }
      
      // Check if usePageTitle() is already called
      if (content.includes('usePageTitle()')) {
        console.log(`✅ ${filePath} - usePageTitle() already called`);
        return;
      }
      
      // Add import if not present
      const importRegex = /import.*from ['"]@\/hooks\/.*['"];?/;
      const lastImportMatch = Array.from(content.matchAll(/import.*from ['"].*['"];?/g)).pop();
      
      if (lastImportMatch) {
        const importIndex = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, importIndex) + 
                 "\nimport usePageTitle from '@/hooks/usePageTitle';" + 
                 content.slice(importIndex);
      }
      
      // Find the main component function and add usePageTitle()
      const componentNameMatch = filePath.match(/\/([^\/]+)\.tsx$/);
      if (!componentNameMatch) return;
      
      const componentName = componentNameMatch[1];
      const functionRegex = new RegExp(`(const ${componentName}[^=]*=.*?\\{)([\\s\\S]*?)`, 'm');
      const match = content.match(functionRegex);
      
      if (match) {
        const afterBrace = match[1];
        const restOfFunction = match[2];
        
        // Add usePageTitle() after the opening brace
        content = content.replace(functionRegex, 
          `${afterBrace}\n  // Set page title\n  usePageTitle();\n${restOfFunction}`
        );
        
        // Write the modified content back
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ ${filePath} - Added usePageTitle hook`);
      } else {
        console.log(`⚠️  ${filePath} - Could not find component function`);
      }
      
    } catch (error) {
      console.log(`❌ ${filePath} - Error: ${error.message}`);
    }
  });
  
  console.log('\n🎉 Finished adding usePageTitle hook to all components!');
}

// Run the script
addPageTitleToComponents();
