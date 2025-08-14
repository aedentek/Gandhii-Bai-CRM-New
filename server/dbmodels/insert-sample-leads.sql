-- SQL Script to add 20 sample leads to your leads table
-- Run this script in your MySQL database (via phpMyAdmin, MySQL Workbench, or command line)

-- First, let's ensure we have some lead categories
INSERT IGNORE INTO lead_categories (name, description, createdAt) VALUES
('Real Estate', 'Property buying and selling leads', CURDATE()),
('Insurance', 'Life and health insurance prospects', CURDATE()),
('Education', 'Training and coaching inquiries', CURDATE()),
('Healthcare', 'Medical services and consultations', CURDATE()),
('Finance', 'Loan and investment opportunities', CURDATE()),
('Technology', 'Software and IT service leads', CURDATE()),
('Automotive', 'Car sales and service leads', CURDATE()),
('Travel', 'Tour and travel package inquiries', CURDATE());

-- Now insert 20 sample leads
INSERT INTO leads (date, name, contactNumber, reminderDate, category, status, description) VALUES
('2024-12-15', 'Rajesh Kumar', '9876543210', '2025-01-15', 'Real Estate', 'Reminder', 'Interested in 2BHK apartment in Mumbai'),
('2024-12-14', 'Priya Sharma', '9765432109', '2025-01-10', 'Insurance', 'Closed', 'Successfully sold life insurance policy'),
('2024-12-13', 'Amit Patel', '9654321098', '2025-01-20', 'Education', 'Reminder', 'Wants to join digital marketing course'),
('2024-12-12', 'Sneha Gupta', '9543210987', '2025-01-08', 'Healthcare', 'Not Interested', 'Not interested in our dental services'),
('2024-12-11', 'Vikram Singh', '9432109876', '2025-01-25', 'Finance', 'Reminder', 'Considering home loan options'),
('2024-12-10', 'Meera Joshi', '9321098765', '2025-01-12', 'Technology', 'Closed', 'Purchased website development package'),
('2024-12-09', 'Rahul Verma', '9210987654', '2025-01-18', 'Automotive', 'Reminder', 'Looking for used car under 5 lakhs'),
('2024-12-08', 'Kavita Nair', '9109876543', '2025-01-14', 'Travel', 'Closed', 'Booked Kerala tour package'),
('2024-12-07', 'Suresh Reddy', '9098765432', '2025-01-22', 'Real Estate', 'Reminder', 'Wants commercial space in Bangalore'),
('2024-12-06', 'Pooja Mishra', '8987654321', '2025-01-16', 'Insurance', 'Not Interested', 'Already has insurance coverage'),
('2024-12-05', 'Deepak Agarwal', '8876543210', '2025-01-30', 'Education', 'Reminder', 'Interested in MBA coaching classes'),
('2024-12-04', 'Anjali Kapoor', '8765432109', '2025-01-11', 'Healthcare', 'Closed', 'Completed dental treatment successfully'),
('2024-12-03', 'Manoj Yadav', '8654321098', '2025-01-28', 'Finance', 'Reminder', 'Needs personal loan for business'),
('2024-12-02', 'Ritu Bansal', '8543210987', '2025-01-13', 'Technology', 'Not Interested', 'Budget constraints for software'),
('2024-12-01', 'Kiran Thakur', '8432109876', '2025-01-26', 'Automotive', 'Reminder', 'Interested in car insurance renewal'),
('2024-11-30', 'Sonia Chawla', '8321098765', '2025-01-09', 'Travel', 'Closed', 'Confirmed international vacation package'),
('2024-11-29', 'Ashok Jain', '8210987654', '2025-01-24', 'Real Estate', 'Reminder', 'Looking for plot in Gurgaon'),
('2024-11-28', 'Nisha Saxena', '8109876543', '2025-01-17', 'Insurance', 'Closed', 'Renewed vehicle insurance policy'),
('2024-11-27', 'Rohit Malhotra', '8098765432', '2025-01-31', 'Education', 'Reminder', 'Considering online certification course'),
('2024-11-26', 'Divya Sinha', '7987654321', '2025-01-19', 'Healthcare', 'Not Interested', 'Prefers local clinic over our services');

-- Verify the data was inserted
SELECT COUNT(*) as total_leads FROM leads;
SELECT status, COUNT(*) as count FROM leads GROUP BY status;

-- Show all leads with their details
SELECT id, date, name, contactNumber, category, status, description FROM leads ORDER BY date DESC;
