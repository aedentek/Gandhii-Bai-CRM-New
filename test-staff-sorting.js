// Testing Staff ID Sorting Function
// This demonstrates how the sorting works for Staff IDs in STF001 format

const testStaffData = [
  { id: 'STF010', name: 'John Smith' },
  { id: 'STF002', name: 'Jane Doe' }, 
  { id: 'STF001', name: 'Alice Johnson' },
  { id: 'STF005', name: 'Bob Wilson' },
  { id: 'STF003', name: 'Charlie Brown' },
  { id: 'STF015', name: 'David Davis' },
  { id: 'STF007', name: 'Eva Garcia' }
];

// Sort function (same as in staff-advance.tsx)
const sortStaffById = (staffList) => {
  return staffList.sort((a, b) => {
    // Extract numeric part from staff ID (e.g., STF001 -> 1, STF002 -> 2)
    const aNum = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const bNum = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    return aNum - bNum;
  });
};

console.log('📋 Original Staff Order:');
testStaffData.forEach((staff, index) => {
  console.log(`${index + 1}. ${staff.id} - ${staff.name}`);
});

console.log('\n📊 Sorted Staff Order (Ascending by Staff ID):');
const sortedStaff = sortStaffById([...testStaffData]);
sortedStaff.forEach((staff, index) => {
  console.log(`${index + 1}. ${staff.id} - ${staff.name}`);
});

console.log('\n✅ Staff IDs are now sorted in ascending order: STF001, STF002, STF003, etc.');
