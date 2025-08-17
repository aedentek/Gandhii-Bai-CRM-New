// Debug the date conversion function
const convertDateFormat = (dateStr) => {
  console.log(`🔧 convertDateFormat called with: "${dateStr}" (type: ${typeof dateStr})`);
  
  if (!dateStr) {
    console.log('❌ No dateStr provided, returning null');
    return null;
  }
  
  try {
    // Check if already in yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log('✅ Already in yyyy-MM-dd format');
      return dateStr;
    }
    
    // Convert dd-MM-yyyy to yyyy-MM-dd
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      console.log('🔄 Converting dd-MM-yyyy to yyyy-MM-dd');
      const [day, month, year] = dateStr.split('-');
      console.log(`  Parts: day=${day}, month=${month}, year=${year}`);
      const result = `${year}-${month}-${day}`;
      console.log(`  Result: ${result}`);
      return result;
    }
    
    // If it's a Date object, convert to yyyy-MM-dd
    if (dateStr instanceof Date) {
      console.log('📅 Converting Date object');
      const result = dateStr.toISOString().split('T')[0];
      console.log(`  Result: ${result}`);
      return result;
    }
    
    console.log('❌ No matching format found');
    return null;
  } catch (error) {
    console.error('❌ Date conversion error:', error);
    return null;
  }
};

// Test the problematic cases
console.log('🧪 Testing convertDateFormat function...\n');

const testCases = [
  '18-08-2025',
  '16-01-1990',
  '2025-08-18',
  new Date('2025-08-18'),
  '',
  null,
  undefined
];

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  const result = convertDateFormat(testCase);
  console.log(`Final result: ${result}`);
});
