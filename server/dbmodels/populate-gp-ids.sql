-- Update existing general_products records with GP IDs
-- This script generates GP IDs for existing records

-- First, let's create a temporary stored procedure to generate GP IDs
DELIMITER //

CREATE PROCEDURE UpdateGpIds()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE record_id INT;
    DECLARE counter INT DEFAULT 1;
    DECLARE gp_id_value VARCHAR(10);
    
    -- Cursor to iterate through all records without GP ID
    DECLARE cur CURSOR FOR 
        SELECT id FROM general_products 
        WHERE gp_id IS NULL OR gp_id = '' 
        ORDER BY id ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO record_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Generate GP ID with leading zeros
        SET gp_id_value = CONCAT('GP', LPAD(counter, 4, '0'));
        
        -- Update the record
        UPDATE general_products 
        SET gp_id = gp_id_value 
        WHERE id = record_id;
        
        SET counter = counter + 1;
    END LOOP;
    
    CLOSE cur;
END//

DELIMITER ;

-- Call the procedure
CALL UpdateGpIds();

-- Drop the procedure after use
DROP PROCEDURE UpdateGpIds;
