-- SQL Script to add 30 sample leads for August and September 2025
-- 15 leads for August 2025 (current month) and 15 leads for September 2025 (next month)

-- Insert 15 leads for August 2025
INSERT INTO leads (date, name, contactNumber, reminderDate, category, status, description) VALUES
-- August 2025 leads
('2025-08-01', 'Arjun Sharma', '9876543211', '2025-08-20', 'Real Estate', 'Reminder', 'Looking for 3BHK apartment in Delhi'),
('2025-08-03', 'Neha Patel', '9765432110', '2025-08-15', 'Insurance', 'Closed', 'Purchased health insurance policy'),
('2025-08-05', 'Rohit Kumar', '9654321109', '2025-08-25', 'Education', 'Reminder', 'Interested in data science course'),
('2025-08-07', 'Priya Singh', '9543210988', '2025-08-18', 'Healthcare', 'Not Interested', 'Already has a family doctor'),
('2025-08-09', 'Vikash Gupta', '9432109877', '2025-08-30', 'Finance', 'Reminder', 'Needs business loan for startup'),
('2025-08-11', 'Anita Joshi', '9321098766', '2025-08-22', 'Technology', 'Closed', 'Bought mobile app development service'),
('2025-08-13', 'Deepak Yadav', '9210987655', '2025-08-28', 'Automotive', 'Reminder', 'Planning to buy electric scooter'),
('2025-08-15', 'Sunita Nair', '9109876544', '2025-08-24', 'Travel', 'Closed', 'Booked Goa vacation package'),
('2025-08-17', 'Manoj Reddy', '9098765433', '2025-08-31', 'Real Estate', 'Reminder', 'Searching for office space in Hyderabad'),
('2025-08-19', 'Kavita Mishra', '8987654322', '2025-08-26', 'Insurance', 'Not Interested', 'Premium too high for current budget'),
('2025-08-21', 'Rajesh Agarwal', '8876543211', '2025-09-05', 'Education', 'Reminder', 'Considering online MBA program'),
('2025-08-23', 'Pooja Kapoor', '8765432100', '2025-08-27', 'Healthcare', 'Closed', 'Scheduled dental treatment'),
('2025-08-25', 'Suresh Bansal', '8654321099', '2025-09-02', 'Finance', 'Reminder', 'Looking for home loan options'),
('2025-08-27', 'Meera Thakur', '8543210988', '2025-08-29', 'Technology', 'Not Interested', 'Current software meets requirements'),
('2025-08-29', 'Ashish Chawla', '8432109877', '2025-09-03', 'Automotive', 'Reminder', 'Interested in car service package'),

-- September 2025 leads
('2025-09-02', 'Ravi Malhotra', '8321098766', '2025-09-15', 'Travel', 'Closed', 'Confirmed international tour package'),
('2025-09-04', 'Sonia Jain', '8210987655', '2025-09-20', 'Real Estate', 'Reminder', 'Want to invest in commercial property'),
('2025-09-06', 'Kiran Saxena', '8109876544', '2025-09-18', 'Insurance', 'Closed', 'Renewed term life insurance'),
('2025-09-08', 'Amit Sinha', '8098765433', '2025-09-25', 'Education', 'Reminder', 'Planning to join coding bootcamp'),
('2025-09-10', 'Divya Verma', '7987654322', '2025-09-22', 'Healthcare', 'Not Interested', 'Satisfied with current healthcare provider'),
('2025-09-12', 'Nitin Kumar', '7876543211', '2025-09-28', 'Finance', 'Reminder', 'Exploring mutual fund investments'),
('2025-09-14', 'Rekha Patel', '7765432100', '2025-09-24', 'Technology', 'Closed', 'Purchased CRM software license'),
('2025-09-16', 'Arun Gupta', '7654321099', '2025-09-30', 'Automotive', 'Reminder', 'Considering hybrid car purchase'),
('2025-09-18', 'Nisha Sharma', '7543210988', '2025-09-26', 'Travel', 'Closed', 'Booked honeymoon trip to Europe'),
('2025-09-20', 'Sandeep Yadav', '7432109877', '2025-10-02', 'Real Estate', 'Reminder', 'Looking for farmhouse near Pune'),
('2025-09-22', 'Geeta Mishra', '7321098766', '2025-09-29', 'Insurance', 'Not Interested', 'Company already provides insurance'),
('2025-09-24', 'Varun Joshi', '7210987655', '2025-10-05', 'Education', 'Reminder', 'Interested in professional certification'),
('2025-09-26', 'Lalita Nair', '7109876544', '2025-09-27', 'Healthcare', 'Closed', 'Completed health checkup package'),
('2025-09-28', 'Prakash Reddy', '7098765433', '2025-10-08', 'Finance', 'Reminder', 'Needs education loan for daughter'),
('2025-09-30', 'Shweta Agarwal', '6987654322', '2025-10-04', 'Technology', 'Not Interested', 'Budget constraints for IT upgrade');

-- Verify the data was inserted
SELECT 
  YEAR(STR_TO_DATE(date, '%Y-%m-%d')) as year,
  MONTH(STR_TO_DATE(date, '%Y-%m-%d')) as month,
  MONTHNAME(STR_TO_DATE(date, '%Y-%m-%d')) as month_name,
  COUNT(*) as lead_count
FROM leads 
WHERE STR_TO_DATE(date, '%Y-%m-%d') >= '2025-08-01' 
  AND STR_TO_DATE(date, '%Y-%m-%d') <= '2025-09-30'
GROUP BY YEAR(STR_TO_DATE(date, '%Y-%m-%d')), MONTH(STR_TO_DATE(date, '%Y-%m-%d'))
ORDER BY year, month;

-- Show status distribution for the new leads
SELECT 
  status, 
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads WHERE STR_TO_DATE(date, '%Y-%m-%d') >= '2025-08-01' AND STR_TO_DATE(date, '%Y-%m-%d') <= '2025-09-30')), 2) as percentage
FROM leads 
WHERE STR_TO_DATE(date, '%Y-%m-%d') >= '2025-08-01' 
  AND STR_TO_DATE(date, '%Y-%m-%d') <= '2025-09-30'
GROUP BY status;

-- Show category distribution for the new leads
SELECT 
  category, 
  COUNT(*) as count
FROM leads 
WHERE STR_TO_DATE(date, '%Y-%m-%d') >= '2025-08-01' 
  AND STR_TO_DATE(date, '%Y-%m-%d') <= '2025-09-30'
GROUP BY category
ORDER BY count DESC;
