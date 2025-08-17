// Test continuous carry forward calculation
// Sabarish joined in April 2025, let's calculate carry forward for different months

const testData = {
  name: "Sabarish T",
  admissionDate: "2025-04-30", // April 2025
  monthlyFees: 15000,
  otherFees: 600, // One-time joining fees
  paidAmount: 1000 // Amount paid in joining month
};

function calculateContinuousCarryForward(joiningMonth, joiningYear, viewingMonth, viewingYear, monthlyFees, otherFees, paidAmount) {
  // If viewing the joining month, carry forward is 0
  if (joiningMonth === viewingMonth && joiningYear === viewingYear) {
    return 0;
  }
  
  let totalCarryForward = 0;
  let currentMonth = joiningMonth;
  let currentYear = joiningYear;
  
  console.log(`\n🔄 Calculating carry forward from ${currentMonth + 1}/${currentYear} to ${viewingMonth + 1}/${viewingYear}`);
  
  // Loop through months from joining month to the month before viewing month
  while (currentYear < viewingYear || (currentYear === viewingYear && currentMonth < viewingMonth)) {
    let monthBalance = 0;
    
    if (currentMonth === joiningMonth && currentYear === joiningYear) {
      // Joining month: Monthly Fees + Other Fees - Paid Amount
      monthBalance = monthlyFees + otherFees - paidAmount;
      console.log(`📅 ${currentMonth + 1}/${currentYear} (Joining): ${monthlyFees} + ${otherFees} - ${paidAmount} = ${monthBalance}`);
    } else {
      // Subsequent months: Monthly Fees (no payments in subsequent months yet)
      monthBalance = monthlyFees;
      console.log(`📅 ${currentMonth + 1}/${currentYear}: ${monthlyFees} = ${monthBalance}`);
    }
    
    totalCarryForward += Math.max(0, monthBalance);
    
    // Move to next month
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  
  return totalCarryForward;
}

// Test scenarios
console.log("=== CONTINUOUS CARRY FORWARD TESTS ===");

// Scenario 1: April 2025 (joining month)
const april2025 = calculateContinuousCarryForward(3, 2025, 3, 2025, testData.monthlyFees, testData.otherFees, testData.paidAmount);
console.log(`🟢 April 2025 (Joining): ₹${april2025.toLocaleString()}`);

// Scenario 2: May 2025 (1 month after joining)
const may2025 = calculateContinuousCarryForward(3, 2025, 4, 2025, testData.monthlyFees, testData.otherFees, testData.paidAmount);
console.log(`🟡 May 2025: ₹${may2025.toLocaleString()}`);

// Scenario 3: June 2025 (2 months after joining)
const june2025 = calculateContinuousCarryForward(3, 2025, 5, 2025, testData.monthlyFees, testData.otherFees, testData.paidAmount);
console.log(`🟠 June 2025: ₹${june2025.toLocaleString()}`);

// Scenario 4: July 2025 (3 months after joining)
const july2025 = calculateContinuousCarryForward(3, 2025, 6, 2025, testData.monthlyFees, testData.otherFees, testData.paidAmount);
console.log(`🔴 July 2025: ₹${july2025.toLocaleString()}`);

// Scenario 5: August 2025 (4 months after joining)
const august2025 = calculateContinuousCarryForward(3, 2025, 7, 2025, testData.monthlyFees, testData.otherFees, testData.paidAmount);
console.log(`🟣 August 2025: ₹${august2025.toLocaleString()}`);

console.log("\n=== EXPECTED RESULTS ===");
console.log("April 2025: ₹0 (joining month)");
console.log("May 2025: ₹14,600 (15000 + 600 - 1000)");
console.log("June 2025: ₹29,600 (14,600 + 15,000)");
console.log("July 2025: ₹44,600 (29,600 + 15,000)");
console.log("August 2025: ₹59,600 (44,600 + 15,000)");
