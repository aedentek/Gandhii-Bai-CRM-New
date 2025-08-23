// Test the date filtering logic
const testProduct = {
  id: "54",
  name: "Sabarish T",
  description: "",
  category: "Stationary",
  supplier: "SAS",
  price: 180,
  quantity: 100,
  status: "active",
  createdAt: "2025-08-21T18:30:00.000Z",
  purchaseDate: "2025-08-21T18:30:00.000Z"
};

// Current date filter values (August 2025)
const filterMonth = 8; // 1-based (August)
const filterYear = 2025;
const searchTerm = "";
const statusFilter = "all";

// Test the filtering logic
const matchesSearch = 
  testProduct.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  testProduct.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  testProduct.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

let matchesStatus = true;
if (statusFilter !== 'all') {
  if (statusFilter === 'low-stock') {
    matchesStatus = testProduct.quantity < 10;
  } else {
    matchesStatus = testProduct.status === statusFilter;
  }
}

console.log('Search matches:', matchesSearch);
console.log('Status matches:', matchesStatus);

if (filterMonth !== null && filterYear !== null) {
  const dateStr = testProduct.purchaseDate || testProduct.createdAt;
  console.log('Date string:', dateStr);
  
  if (!dateStr) {
    console.log('No date string found');
  } else {
    let d;
    if (dateStr.includes('T')) {
      d = new Date(dateStr);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      d = new Date(dateStr + 'T00:00:00');
    }
    
    console.log('Parsed date:', d);
    console.log('Date month (0-based):', d.getMonth());
    console.log('Filter month (1-based):', filterMonth);
    console.log('Filter month (0-based):', filterMonth - 1);
    console.log('Date year:', d.getFullYear());
    console.log('Filter year:', filterYear);
    
    const monthMatches = d.getMonth() === (filterMonth - 1);
    const yearMatches = d.getFullYear() === filterYear;
    
    console.log('Month matches:', monthMatches);
    console.log('Year matches:', yearMatches);
    console.log('Final result should be:', matchesSearch && matchesStatus && monthMatches && yearMatches);
  }
}
