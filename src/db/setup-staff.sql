-- Drop and recreate table
DROP TABLE IF EXISTS staff;
CREATE TABLE staff (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(100),
    department VARCHAR(255),
    address TEXT,
    join_date DATE,
    salary DECIMAL(10,2),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    photo TEXT,
    documents TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(255)
);

-- Insert sample data
INSERT INTO staff (id, name, email, phone, role, department, address, join_date, salary, status, photo, documents) VALUES
('STF001', 'John Smith', 'john.smith@example.com', '5555555555', 'Doctor', 'Medical', 'COMPLEX, ALANGANALLUR MAIN R 155-A/156-B', '2025-01-15', 75000.00, 'Active', NULL, '{"aadharNumber":"123456789012","panNumber":"ABCDE1234F"}'),
('STF002', 'Sarah Johnson', 'sarah.j@example.com', '5555555555', 'Nurse', 'Medical', 'COMPLEX, ALANGANALLUR MAIN R 155-A/156-B', '2025-02-01', 45000.00, 'Active', NULL, '{"aadharNumber":"123456789013","panNumber":"ABCDE1235F"}'),
('STF003', 'Michael Brown', 'michael.b@example.com', '5555555555', 'Administrator', 'Admin', 'COMPLEX, ALANGANALLUR MAIN R 155-A/156-B', '2025-02-15', 55000.00, 'Active', NULL, '{"aadharNumber":"123456789014","panNumber":"ABCDE1236F"}'),
('STF004', 'Emma Wilson', 'emma.w@example.com', '5555555555', 'Nurse', 'Medical', 'COMPLEX, ALANGANALLUR MAIN R 155-A/156-B', '2025-03-01', 45000.00, 'Active', NULL, '{"aadharNumber":"123456789015","panNumber":"ABCDE1237F"}');
