// Script to add 30 sample leads for August and September 2025
// 15 leads for current month (August) and 15 leads for next month (September)

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:4000/api';

const augustLeads = [
  {
    date: '2025-08-01',
    name: 'Arjun Sharma',
    contactNumber: '9876543211',
    reminderDate: '2025-08-20',
    category: 'Real Estate',
    status: 'Reminder',
    description: 'Looking for 3BHK apartment in Delhi'
  },
  {
    date: '2025-08-03',
    name: 'Neha Patel',
    contactNumber: '9765432110',
    reminderDate: '2025-08-15',
    category: 'Insurance',
    status: 'Closed',
    description: 'Purchased health insurance policy'
  },
  {
    date: '2025-08-05',
    name: 'Rohit Kumar',
    contactNumber: '9654321109',
    reminderDate: '2025-08-25',
    category: 'Education',
    status: 'Reminder',
    description: 'Interested in data science course'
  },
  {
    date: '2025-08-07',
    name: 'Priya Singh',
    contactNumber: '9543210988',
    reminderDate: '2025-08-18',
    category: 'Healthcare',
    status: 'Not Interested',
    description: 'Already has a family doctor'
  },
  {
    date: '2025-08-09',
    name: 'Vikash Gupta',
    contactNumber: '9432109877',
    reminderDate: '2025-08-30',
    category: 'Finance',
    status: 'Reminder',
    description: 'Needs business loan for startup'
  },
  {
    date: '2025-08-11',
    name: 'Anita Joshi',
    contactNumber: '9321098766',
    reminderDate: '2025-08-22',
    category: 'Technology',
    status: 'Closed',
    description: 'Bought mobile app development service'
  },
  {
    date: '2025-08-13',
    name: 'Deepak Yadav',
    contactNumber: '9210987655',
    reminderDate: '2025-08-28',
    category: 'Automotive',
    status: 'Reminder',
    description: 'Planning to buy electric scooter'
  },
  {
    date: '2025-08-15',
    name: 'Sunita Nair',
    contactNumber: '9109876544',
    reminderDate: '2025-08-24',
    category: 'Travel',
    status: 'Closed',
    description: 'Booked Goa vacation package'
  },
  {
    date: '2025-08-17',
    name: 'Manoj Reddy',
    contactNumber: '9098765433',
    reminderDate: '2025-08-31',
    category: 'Real Estate',
    status: 'Reminder',
    description: 'Searching for office space in Hyderabad'
  },
  {
    date: '2025-08-19',
    name: 'Kavita Mishra',
    contactNumber: '8987654322',
    reminderDate: '2025-08-26',
    category: 'Insurance',
    status: 'Not Interested',
    description: 'Premium too high for current budget'
  },
  {
    date: '2025-08-21',
    name: 'Rajesh Agarwal',
    contactNumber: '8876543211',
    reminderDate: '2025-09-05',
    category: 'Education',
    status: 'Reminder',
    description: 'Considering online MBA program'
  },
  {
    date: '2025-08-23',
    name: 'Pooja Kapoor',
    contactNumber: '8765432100',
    reminderDate: '2025-08-27',
    category: 'Healthcare',
    status: 'Closed',
    description: 'Scheduled dental treatment'
  },
  {
    date: '2025-08-25',
    name: 'Suresh Bansal',
    contactNumber: '8654321099',
    reminderDate: '2025-09-02',
    category: 'Finance',
    status: 'Reminder',
    description: 'Looking for home loan options'
  },
  {
    date: '2025-08-27',
    name: 'Meera Thakur',
    contactNumber: '8543210988',
    reminderDate: '2025-08-29',
    category: 'Technology',
    status: 'Not Interested',
    description: 'Current software meets requirements'
  },
  {
    date: '2025-08-29',
    name: 'Ashish Chawla',
    contactNumber: '8432109877',
    reminderDate: '2025-09-03',
    category: 'Automotive',
    status: 'Reminder',
    description: 'Interested in car service package'
  }
];

const septemberLeads = [
  {
    date: '2025-09-02',
    name: 'Ravi Malhotra',
    contactNumber: '8321098766',
    reminderDate: '2025-09-15',
    category: 'Travel',
    status: 'Closed',
    description: 'Confirmed international tour package'
  },
  {
    date: '2025-09-04',
    name: 'Sonia Jain',
    contactNumber: '8210987655',
    reminderDate: '2025-09-20',
    category: 'Real Estate',
    status: 'Reminder',
    description: 'Want to invest in commercial property'
  },
  {
    date: '2025-09-06',
    name: 'Kiran Saxena',
    contactNumber: '8109876544',
    reminderDate: '2025-09-18',
    category: 'Insurance',
    status: 'Closed',
    description: 'Renewed term life insurance'
  },
  {
    date: '2025-09-08',
    name: 'Amit Sinha',
    contactNumber: '8098765433',
    reminderDate: '2025-09-25',
    category: 'Education',
    status: 'Reminder',
    description: 'Planning to join coding bootcamp'
  },
  {
    date: '2025-09-10',
    name: 'Divya Verma',
    contactNumber: '7987654322',
    reminderDate: '2025-09-22',
    category: 'Healthcare',
    status: 'Not Interested',
    description: 'Satisfied with current healthcare provider'
  },
  {
    date: '2025-09-12',
    name: 'Nitin Kumar',
    contactNumber: '7876543211',
    reminderDate: '2025-09-28',
    category: 'Finance',
    status: 'Reminder',
    description: 'Exploring mutual fund investments'
  },
  {
    date: '2025-09-14',
    name: 'Rekha Patel',
    contactNumber: '7765432100',
    reminderDate: '2025-09-24',
    category: 'Technology',
    status: 'Closed',
    description: 'Purchased CRM software license'
  },
  {
    date: '2025-09-16',
    name: 'Arun Gupta',
    contactNumber: '7654321099',
    reminderDate: '2025-09-30',
    category: 'Automotive',
    status: 'Reminder',
    description: 'Considering hybrid car purchase'
  },
  {
    date: '2025-09-18',
    name: 'Nisha Sharma',
    contactNumber: '7543210988',
    reminderDate: '2025-09-26',
    category: 'Travel',
    status: 'Closed',
    description: 'Booked honeymoon trip to Europe'
  },
  {
    date: '2025-09-20',
    name: 'Sandeep Yadav',
    contactNumber: '7432109877',
    reminderDate: '2025-10-02',
    category: 'Real Estate',
    status: 'Reminder',
    description: 'Looking for farmhouse near Pune'
  },
  {
    date: '2025-09-22',
    name: 'Geeta Mishra',
    contactNumber: '7321098766',
    reminderDate: '2025-09-29',
    category: 'Insurance',
    status: 'Not Interested',
    description: 'Company already provides insurance'
  },
  {
    date: '2025-09-24',
    name: 'Varun Joshi',
    contactNumber: '7210987655',
    reminderDate: '2025-10-05',
    category: 'Education',
    status: 'Reminder',
    description: 'Interested in professional certification'
  },
  {
    date: '2025-09-26',
    name: 'Lalita Nair',
    contactNumber: '7109876544',
    reminderDate: '2025-09-27',
    category: 'Healthcare',
    status: 'Closed',
    description: 'Completed health checkup package'
  },
  {
    date: '2025-09-28',
    name: 'Prakash Reddy',
    contactNumber: '7098765433',
    reminderDate: '2025-10-08',
    category: 'Finance',
    status: 'Reminder',
    description: 'Needs education loan for daughter'
  },
  {
    date: '2025-09-30',
    name: 'Shweta Agarwal',
    contactNumber: '6987654322',
    reminderDate: '2025-10-04',
    category: 'Technology',
    status: 'Not Interested',
    description: 'Budget constraints for IT upgrade'
  }
];

async function addLeadsBatch(leads, monthName) {
  console.log(`\n📅 Adding ${leads.length} leads for ${monthName} 2025...`);
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      
      if (response.ok) {
        successCount++;
        console.log(`  ✅ ${i + 1}. Added: ${lead.name} (${lead.category}) - ${lead.date}`);
      } else {
        errorCount++;
        const errorText = await response.text();
        console.log(`  ❌ ${i + 1}. Failed to add: ${lead.name} - ${errorText}`);
      }
    } catch (error) {
      errorCount++;
      console.log(`  ❌ ${i + 1}. Error adding ${lead.name}:`, error.message);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 ${monthName} Summary:`);
  console.log(`  ✅ Successfully added: ${successCount} leads`);
  console.log(`  ❌ Failed to add: ${errorCount} leads`);
  
  return { successCount, errorCount };
}

async function addAugustSeptemberLeads() {
  console.log('🚀 Starting to add August and September 2025 leads...');
  console.log(`📡 API URL: ${API_BASE_URL}`);
  
  try {
    // Add August leads
    const augustResults = await addLeadsBatch(augustLeads, 'August');
    
    // Add September leads
    const septemberResults = await addLeadsBatch(septemberLeads, 'September');
    
    // Final summary
    const totalSuccess = augustResults.successCount + septemberResults.successCount;
    const totalErrors = augustResults.errorCount + septemberResults.errorCount;
    
    console.log('\n🎯 FINAL SUMMARY:');
    console.log(`📅 August 2025: ${augustResults.successCount}/15 leads added`);
    console.log(`📅 September 2025: ${septemberResults.successCount}/15 leads added`);
    console.log(`✅ Total successful: ${totalSuccess}/30 leads`);
    console.log(`❌ Total failed: ${totalErrors}/30 leads`);
    
    if (totalSuccess > 0) {
      console.log('\n🎉 Leads have been added successfully!');
      console.log('📝 Now you can test the month filtering:');
      console.log('   • Page loads with August 2025 leads (current month)');
      console.log('   • Click month selector to switch to September 2025');
      console.log('   • Use "Clear Filter" to see all leads');
      console.log('   • Pagination will work within each month filter');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.log(`\n💡 Make sure your backend server is running on ${API_BASE_URL.replace('/api', '')}`);
  }
}

// Run the script
addAugustSeptemberLeads();
