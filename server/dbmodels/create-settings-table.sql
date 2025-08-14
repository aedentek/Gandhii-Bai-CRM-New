-- Create settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('text', 'file', 'json', 'boolean') DEFAULT 'text',
    file_path VARCHAR(500) NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- Insert default settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('website_title', 'Gandhi Bai CRM', 'text', 'Website title displayed in browser tab'),
('website_favicon', NULL, 'file', 'Website favicon icon file'),
('sidebar_logo', NULL, 'file', 'Sidebar logo image'),
('sidebar_title', 'Gandhi Bai CRM', 'text', 'Sidebar title text'),
('company_name', 'Healthcare Solutions', 'text', 'Company name'),
('theme_mode', 'system', 'text', 'Theme mode: light, dark, or system'),
('primary_color', '#0ea5e9', 'text', 'Primary color theme'),
('accent_color', '#22c55e', 'text', 'Accent color theme'),
('border_radius', 'default', 'text', 'Border radius setting'),
('last_backup_date', NULL, 'text', 'Last database backup date'),
('backup_frequency', 'daily', 'text', 'Backup frequency setting'),
('app_version', '1.0.0', 'text', 'Application version')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
