# Doctor Salary Automatic Carry Forward Guide

## 🔄 **Automatic Carry Forward Functionality**

The system now automatically handles balance carry forward from month to month, ensuring accurate salary tracking and proper balance management.

### **How It Works:**

#### **1. Balance Calculation Formula:**
```
Current Month Balance = Salary + Carry Forward From Previous - Total Paid - Advance
```

#### **2. Carry Forward Logic:**
- **Positive Balance**: Automatically carries forward to next month
- **Zero/Negative Balance**: No carry forward needed (fully paid)

#### **3. When Carry Forward Happens:**
- Automatically when you click "Save Monthly" button
- System processes all doctors and calculates their balances
- Positive balances are marked for carry forward to next month

### **Enhanced Features:**

#### **🎯 Save Monthly Button:**
- Calculates current month balances for all doctors
- Automatically sets carry forward amounts for next month
- Shows notification with number of doctors having carry forward
- Provides detailed feedback on processed records

#### **📊 Carry Forward Column:**
- Displays carry forward amount from previous month
- Updates automatically when monthly records are saved
- Included in balance calculations and statistics

#### **💰 Updated Balance Calculation:**
- **Previous**: `Balance = Salary - Total Paid - Advance`
- **New**: `Balance = Salary + Carry Forward - Total Paid - Advance`

#### **📈 Statistics Cards:**
- **Total Salary**: Includes carry forward amounts
- **Total Paid**: Payments + Advances
- **Pending**: Reflects accurate balance including carry forward

### **Usage Workflow:**

#### **Step 1: View Current Month**
- Navigate to Doctor Salary Management
- Select current month/year or leave as "All Months"
- Review salary data and any existing carry forward amounts

#### **Step 2: Save Monthly Records**
- Click "Save Monthly" button (green button in top right)
- System processes all active doctors
- Calculates balances and determines carry forward amounts
- Shows notification with carry forward summary

#### **Step 3: Next Month Operations**
- Navigate to next month
- Carry forward amounts automatically appear in "Carry Forward" column
- New balance calculations include previous month's carry forward
- Continue normal payment and advance operations

### **Database Structure:**

#### **doctor_monthly_salary Table Columns:**
- `base_salary`: Doctor's base monthly salary
- `total_paid`: Total payments made in the month
- `advance_amount`: Advance amount for the month
- `carry_forward_from_previous`: Amount carried from previous month
- `carry_forward_to_next`: Amount to carry to next month
- `net_balance`: Final balance after all calculations

### **API Endpoints:**

#### **POST** `/api/doctor-salaries/save-monthly-records`
- Saves monthly records with automatic carry forward
- Calculates balances and sets carry forward amounts
- Returns processed count and carry forward statistics

#### **GET** `/api/doctor-salaries/carry-forward/{month}/{year}`
- Retrieves carry forward information for specific month
- Shows doctors with carry forward amounts
- Provides total carry forward summary

#### **POST** `/api/doctor-salaries/process-carry-forward`
- Manually process carry forward between specific months
- Creates or updates next month records with carry forward
- Handles bulk carry forward operations

### **User Interface Enhancements:**

#### **🔔 Smart Notifications:**
- Shows carry forward summary after saving monthly records
- Alerts when viewing months with carry forward amounts
- Provides detailed feedback on balance processing

#### **📋 Enhanced Table:**
- "Carry Forward" column shows previous month balance
- Balance calculation includes carry forward amounts
- Color-coded status based on complete balance calculation

#### **📊 Accurate Statistics:**
- Total Salary includes base salary + carry forward
- Pending amount reflects true outstanding balance
- Consistent calculations across all views

### **Benefits:**

✅ **Automatic Process**: No manual intervention needed for carry forward
✅ **Accurate Tracking**: True balance calculation including previous months
✅ **Seamless Workflow**: Integrated with existing save monthly process
✅ **Complete Audit**: Full history of carry forward amounts
✅ **Smart Notifications**: Clear feedback on carry forward status

### **Example Scenario:**

**August 2025:**
- Doctor Salary: ₹15,000
- Total Paid: ₹5,000
- Advance: ₹8,500
- **Balance**: ₹15,000 - ₹5,000 - ₹8,500 = ₹1,500 (carries forward)

**September 2025:**
- Doctor Salary: ₹15,000
- Carry Forward: ₹1,500 (from August)
- Total Available: ₹16,500
- Any payments will be deducted from this total amount

This system ensures complete accuracy in salary management and eliminates manual carry forward calculations!
